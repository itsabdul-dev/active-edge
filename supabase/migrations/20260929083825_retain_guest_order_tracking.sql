-- Preserve converted cart ownership until its original session expires.
create or replace function public.manage_cart(p_token_hash text, p_customer_id uuid, p_operation text, p_variant_id uuid default null, p_quantity integer default null, p_import jsonb default '[]'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.cart; guest public.cart; line jsonb; result jsonb; merged integer;
begin
  if length(p_token_hash) <> 64 then raise exception 'Invalid cart session'; end if;
  if p_operation not in ('load','add','set','remove','clear','import') then raise exception 'Invalid cart operation'; end if;
  -- Serializes first-cart creation and repeated guest requests as well as merges.
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_customer_id::text,p_token_hash),0));
  select * into guest from public.cart where session_token_hash = p_token_hash and customer_id is null and status = 'active' and expires_at > now() for update;
  if p_customer_id is not null then
    insert into public.customer(customer_id) values(p_customer_id) on conflict do nothing;
    update public.cart set status = 'expired' where customer_id = p_customer_id and status = 'active' and expires_at <= now();
    select * into c from public.cart where customer_id = p_customer_id and status = 'active' for update;
    if c.cart_id is null then
      insert into public.cart(customer_id) values(p_customer_id) returning * into c;
    end if;
    if guest.cart_id is not null then
      insert into public.cart_item(cart_id, variant_id, quantity)
        select c.cart_id, variant_id, quantity from public.cart_item where cart_id = guest.cart_id
        on conflict(cart_id,variant_id) do update set quantity = least(99,public.cart_item.quantity + excluded.quantity);
      update public.cart set status = 'converted', session_token_hash = null where cart_id = guest.cart_id;
    end if;
  else
    c := guest;
    if c.cart_id is null then
      update public.cart set status = 'expired', session_token_hash = null where session_token_hash = p_token_hash and status <> 'converted';
      insert into public.cart(session_token_hash) values(p_token_hash) returning * into c;
    end if;
  end if;
  if p_operation = 'import' then
    if jsonb_typeof(p_import) <> 'array' or jsonb_array_length(p_import) > 100 then raise exception 'Invalid cart'; end if;
    for line in select value from jsonb_array_elements(p_import) loop
      if (line->>'quantity')::integer not between 1 and 99 then raise exception 'Invalid quantity'; end if;
      insert into public.cart_item(cart_id, variant_id, quantity)
        select c.cart_id,v.variant_id,(line->>'quantity')::integer
        from public.product_variant v join public.product_colour pc using(product_colour_id) join public.product p using(product_id)
        where v.variant_id = (line->>'variant_id')::uuid and v.is_active and p.is_active
        on conflict(cart_id, variant_id) do update set quantity = greatest(public.cart_item.quantity, excluded.quantity);
    end loop;
  elsif p_operation in ('add','set') then
    if p_quantity is null or p_quantity not between 1 and 99 then raise exception 'Invalid quantity'; end if;
    if not exists(select 1 from public.product_variant v join public.product_colour pc using(product_colour_id) join public.product p using(product_id) where v.variant_id = p_variant_id and v.is_active and p.is_active) then raise exception 'Product unavailable'; end if;
    if p_operation = 'add' then
      insert into public.cart_item(cart_id,variant_id,quantity) values(c.cart_id,p_variant_id,p_quantity)
      on conflict(cart_id,variant_id) do update set quantity = least(99,public.cart_item.quantity + excluded.quantity);
    else
      insert into public.cart_item(cart_id,variant_id,quantity) values(c.cart_id,p_variant_id,p_quantity)
      on conflict(cart_id,variant_id) do update set quantity = excluded.quantity;
    end if;
  elsif p_operation = 'remove' then
    delete from public.cart_item where cart_id = c.cart_id and variant_id = p_variant_id;
  elsif p_operation = 'clear' then
    delete from public.cart_item where cart_id = c.cart_id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',v.variant_id,'variantId',v.variant_id,'slug',p.slug,'name',p.name,
    'variant',pc.colour_name,'size',v.size_code,'price',v.price_cents / 100.0,
    'qty',i.quantity,'image',(select pi.storage_path from public.product_image pi where pi.product_colour_id = pc.product_colour_id order by pi.display_order limit 1)
  ) order by p.display_order, pc.display_order, v.size_code),'[]'::jsonb) into result
  from public.cart_item i join public.product_variant v using(variant_id) join public.product_colour pc using(product_colour_id) join public.product p using(product_id)
  where i.cart_id = c.cart_id;
  return jsonb_build_object('cartId',c.cart_id,'lines',result);
end $$;
revoke all on function public.manage_cart(text,uuid,text,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.manage_cart(text,uuid,text,uuid,integer,jsonb) to service_role;

