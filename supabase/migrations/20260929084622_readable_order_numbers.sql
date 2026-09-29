begin;
-- One concurrency-safe sequence; order UUIDs and tracking links are unchanged.
create sequence private.order_number_seq;
revoke all on sequence private.order_number_seq from public,anon,authenticated;
grant usage on sequence private.order_number_seq to service_role;
create function public.next_order_number(p_placed_at timestamptz default now()) returns text
language sql volatile security invoker set search_path='' as $$
 select 'AE-'||to_char(p_placed_at at time zone 'Africa/Johannesburg','YYYY')||'-'||lpad(n::text,greatest(6,length(n::text)),'0') from (select nextval('private.order_number_seq') as n) counter;
$$;
revoke all on function public.next_order_number(timestamptz) from public,anon,authenticated;
grant execute on function public.next_order_number(timestamptz) to service_role;
-- Rename existing UUID-style numbers in creation order.
lock table public.sales_order in share row exclusive mode;
do $$ declare o record; begin
 for o in select order_id,placed_at from public.sales_order where order_number ~ '^(DEMO-)?AE-[0-9A-F]{32}$' order by placed_at,order_id loop
 update public.sales_order set order_number=public.next_order_number(o.placed_at) where order_id=o.order_id;
 end loop;
end $$;
update private.demo_payment_attempt a set result=jsonb_set(a.result,'{orderNumber}',to_jsonb(o.order_number)) from public.sales_order o where a.result->>'orderId'=o.order_id::text;

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
  values(new_order,public.next_order_number(),p_customer_id,c.cart_id,lower(trim(p_address->>'email')),p_address->>'first_name',p_address->>'last_name',p_address->>'phone',p_address->>'street',coalesce(p_address->>'suburb',''),p_address->>'city',p_address->>'postal_code',subtotal,shipping,round((subtotal+shipping)::numeric * 15 / 115)::integer,subtotal+shipping);
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

create or replace function public.simulate_payment(p_attempt_id uuid, p_token_hash text, p_customer_id uuid,
 p_address jsonb, p_outcome text, p_method text, p_brand text, p_last_four text, p_expected_total integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.cart; previous private.demo_payment_attempt; result jsonb; oid uuid; o public.sales_order; total integer;
begin
  if not coalesce((select enabled from private.payment_demo_settings where id),false) then raise exception 'Demo payments disabled'; end if;
  if p_outcome is null or p_outcome not in ('approved','declined','insufficient_funds','cancelled')
    or p_method is null or p_method not in ('card','apple_pay_demo','google_pay_demo')
    or p_brand is null or p_brand not in ('Visa','Mastercard')
    or p_last_four is null or p_last_four !~ '^[0-9]{4}$' then raise exception 'Invalid demo payment'; end if;
  -- Serialize retries before resolving the cart, including after it has been converted.
  perform pg_advisory_xact_lock(hashtextextended(p_attempt_id::text, 0));
  select * into previous from private.demo_payment_attempt where attempt_id=p_attempt_id;
  if previous.attempt_id is not null then
    select * into c from public.cart where cart_id=previous.cart_id;
    if not coalesce((p_customer_id is not null and c.customer_id=p_customer_id) or
      (p_customer_id is null and c.customer_id is null and c.session_token_hash=p_token_hash),false) then raise exception 'Payment unavailable'; end if;
    return previous.result;
  end if;
  select * into c from public.cart where status='active' and expires_at>now() and
    ((p_customer_id is not null and customer_id=p_customer_id) or
     (p_customer_id is null and customer_id is null and session_token_hash=p_token_hash))
    order by created_at desc limit 1 for update;
  if c.cart_id is null or not exists(select 1 from public.cart_item where cart_id=c.cart_id) then raise exception 'Cart unavailable'; end if;
  select sum(i.quantity*v.price_cents)::integer into total from public.cart_item i join public.product_variant v using(variant_id) where i.cart_id=c.cart_id;
  total := total + case when total>=90000 then 0 else 8500 end;
  if total is distinct from p_expected_total then raise exception 'Price changed. Refresh your bag before paying.'; end if;
  result := jsonb_build_object('status',p_outcome,'reference','DEMO-'||p_attempt_id,'totalCents',total,'method',p_method,'brand',p_brand,'lastFour',p_last_four);
  if p_outcome='approved' then
    oid := public.create_pending_order(c.cart_id,p_token_hash,p_customer_id,p_address);
    select * into o from public.sales_order where order_id=oid;
    if o.status <> 'pending_payment' then raise exception 'Order unavailable'; end if;
    if o.total_cents <> p_expected_total then raise exception 'Price changed. Refresh your bag before paying.'; end if;
    update public.product_variant v set stock_on_hand=v.stock_on_hand-r.quantity
      from public.stock_reservation r where r.order_id=oid and r.variant_id=v.variant_id and r.status='active';
    update public.stock_reservation set status='consumed' where order_id=oid and status='active';
    update public.sales_order set status='paid',is_demo=true where order_id=oid returning * into o;
    insert into public.payment(order_id,provider,method,provider_reference,idempotency_key,amount_cents,status,paid_at,is_demo,card_brand,card_last_four)
      values(oid,'activeedge_simulator',p_method,'DEMO-'||p_attempt_id,p_attempt_id::text,o.total_cents,'succeeded',now(),true,p_brand,p_last_four);
    result := result || jsonb_build_object('orderId',oid,'orderNumber',o.order_number,'totalCents',o.total_cents);
  end if;
  insert into private.demo_payment_attempt(attempt_id,cart_id,result) values(p_attempt_id,c.cart_id,result);
  return result;
end $$;
revoke all on function public.simulate_payment(uuid,text,uuid,jsonb,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.simulate_payment(uuid,text,uuid,jsonb,text,text,text,text,integer) to service_role;

commit;
