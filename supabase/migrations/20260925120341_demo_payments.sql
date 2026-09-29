-- Retain converted guest ownership for payment retries while allowing a new active bag.
alter table public.cart drop constraint cart_session_token_hash_key;
create unique index cart_active_guest_token_idx on public.cart(session_token_hash) where status='active' and session_token_hash is not null;
-- Deliberate demo-only switch. Disable before enabling any real checkout.
create table private.payment_demo_settings (id boolean primary key default true check(id), enabled boolean not null default false);
insert into private.payment_demo_settings values(true,true);
alter table private.payment_demo_settings enable row level security;
grant select on private.payment_demo_settings to service_role;
alter table public.sales_order add column is_demo boolean not null default false;
alter table public.payment add column is_demo boolean not null default false;
alter table public.payment add column card_brand text;
alter table public.payment add column card_last_four text check (card_last_four ~ '^[0-9]{4}$');
create table private.demo_payment_attempt (
  attempt_id uuid primary key,
  cart_id uuid not null references public.cart,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table private.demo_payment_attempt enable row level security;
grant select, insert on private.demo_payment_attempt to service_role;
create index demo_payment_attempt_cart_idx on private.demo_payment_attempt(cart_id);

create function public.simulate_payment(p_attempt_id uuid, p_token_hash text, p_customer_id uuid,
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
    update public.sales_order set status='paid',is_demo=true,order_number='DEMO-'||order_number where order_id=oid returning * into o;
    insert into public.payment(order_id,provider,method,provider_reference,idempotency_key,amount_cents,status,paid_at,is_demo,card_brand,card_last_four)
      values(oid,'activeedge_simulator',p_method,'DEMO-'||p_attempt_id,p_attempt_id::text,o.total_cents,'succeeded',now(),true,p_brand,p_last_four);
    result := result || jsonb_build_object('orderId',oid,'orderNumber',o.order_number,'totalCents',o.total_cents);
  end if;
  insert into private.demo_payment_attempt(attempt_id,cart_id,result) values(p_attempt_id,c.cart_id,result);
  return result;
end $$;
revoke all on function public.simulate_payment(uuid,text,uuid,jsonb,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.simulate_payment(uuid,text,uuid,jsonb,text,text,text,text,integer) to service_role;
