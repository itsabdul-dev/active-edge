alter table public.sales_order add column unit_snapshot text not null default '' check(length(unit_snapshot)<=120);
alter table public.sales_order add column delivery_instructions_snapshot text not null default '' check(length(delivery_instructions_snapshot)<=500);
create or replace function public.create_pending_order(p_cart_id uuid, p_token_hash text, p_customer_id uuid, p_address jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare c public.cart; existing_order uuid; new_order uuid; item record; available integer; subtotal integer; shipping integer;
begin
  select * into c from public.cart where cart_id = p_cart_id for update;
  if c.cart_id is null or not coalesce(((p_customer_id is not null and c.customer_id = p_customer_id) or (p_customer_id is null and c.customer_id is null and c.session_token_hash = p_token_hash)),false) then raise exception 'Cart unavailable'; end if;
  select order_id into existing_order from public.sales_order where cart_id = c.cart_id;
  if existing_order is not null then return existing_order; end if;
  if c.status <> 'active' or c.expires_at <= now() then raise exception 'Cart expired'; end if;
  if not exists(select 1 from public.cart_item where cart_id = c.cart_id) then raise exception 'Cart is empty'; end if;
  if coalesce(p_address->>'email','') = '' or coalesce(p_address->>'street','') = '' or coalesce(p_address->>'city','') = '' or coalesce(p_address->>'postal_code','') = '' or coalesce(p_address->>'first_name','') = '' or coalesce(p_address->>'last_name','') = '' or coalesce(p_address->>'phone','') = '' then raise exception 'Delivery details incomplete'; end if;
  -- Stable lock order prevents simultaneous checkouts from overselling.
  for item in select v.*,i.quantity from public.cart_item i join public.product_variant v using(variant_id) join public.product_colour pc using(product_colour_id) join public.product p using(product_id) where i.cart_id = c.cart_id order by v.variant_id for update of v loop
    if not item.is_active or not exists(select 1 from public.product_colour pc join public.product p using(product_id) where pc.product_colour_id = item.product_colour_id and p.is_active) then raise exception 'Product unavailable'; end if;
    select item.stock_on_hand - coalesce(sum(quantity),0) into available from public.stock_reservation where variant_id = item.variant_id and status = 'active' and expires_at > now();
    if available < item.quantity then raise exception 'Insufficient stock for %',item.sku; end if;
  end loop;
  select sum(i.quantity::bigint * v.price_cents)::integer into subtotal from public.cart_item i join public.product_variant v using(variant_id) where i.cart_id = c.cart_id;
  shipping := case when subtotal >= 90000 then 0 else 8500 end;
  new_order := gen_random_uuid();
  insert into public.sales_order(order_id,order_number,customer_id,cart_id,email_snapshot,first_name_snapshot,last_name_snapshot,phone_snapshot,street_snapshot,suburb_snapshot,city_snapshot,postal_code_snapshot,subtotal_cents,shipping_cents,tax_included_cents,total_cents)
  values(new_order,'AE-' || upper(replace(new_order::text,'-','')),p_customer_id,c.cart_id,lower(trim(p_address->>'email')),p_address->>'first_name',p_address->>'last_name',p_address->>'phone',p_address->>'street',coalesce(p_address->>'suburb',''),p_address->>'city',p_address->>'postal_code',subtotal,shipping,round((subtotal+shipping)::numeric * 15 / 115)::integer,subtotal+shipping);
  insert into public.order_item(order_id,variant_id,product_name_snapshot,sku_snapshot,colour_snapshot,size_snapshot,quantity,unit_price_cents,tax_rate_snapshot)
    select new_order,v.variant_id,p.name,v.sku,pc.colour_name,v.size_code,i.quantity,v.price_cents,0.15
    from public.cart_item i join public.product_variant v using(variant_id) join public.product_colour pc using(product_colour_id) join public.product p using(product_id) where i.cart_id = c.cart_id;
  insert into public.stock_reservation(order_id,variant_id,quantity,expires_at)
    select new_order,variant_id,quantity,now() + interval '15 minutes' from public.cart_item where cart_id = c.cart_id;
  update public.cart set status = 'converted' where cart_id = c.cart_id;
  update public.sales_order set unit_snapshot=coalesce(p_address->>'unit',''), delivery_instructions_snapshot=coalesce(p_address->>'delivery_instructions','') where order_id=new_order;
  return new_order;
end $$;
revoke all on function public.create_pending_order(uuid,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid,text,uuid,jsonb) to service_role;
