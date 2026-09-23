-- ActiveEdge ERD, extended with authenticated profiles, saved addresses,
-- expiring reservations and payment event deduplication. Amounts are ZAR cents.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.product (
  product_id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  fabric_details text not null default '',
  audience text not null check (audience in ('men','women','unisex')),
  is_set boolean not null default false,
  featured_rank integer,
  display_order integer not null default 0,
  image_fit text not null default 'cover' check (image_fit in ('cover','contain')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.product_colour (
  product_colour_id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.product on delete cascade,
  colour_name text not null,
  hex_code text check (hex_code ~ '^#[0-9a-fA-F]{6}$'),
  display_order integer not null default 0,
  unique(product_id, colour_name)
);
create table public.product_variant (
  variant_id uuid primary key default gen_random_uuid(),
  product_colour_id uuid not null references public.product_colour on delete cascade,
  sku text not null unique,
  size_code text not null,
  price_cents integer not null check (price_cents >= 0),
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  is_active boolean not null default true,
  unique(product_colour_id, size_code)
);
create table public.product_image (
  image_id uuid primary key default gen_random_uuid(),
  product_colour_id uuid not null references public.product_colour on delete cascade,
  storage_path text not null unique,
  alt_text text not null,
  display_order integer not null default 0
);
create index product_image_colour_idx on public.product_image(product_colour_id);
create table public.customer (
  customer_id uuid primary key references auth.users(id) on delete restrict,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
-- Auth owns the verified email. Order contact information is snapshotted below.
create table public.customer_address (
  address_id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer on delete cascade,
  label text not null default 'Home',
  first_name text not null,
  last_name text not null,
  phone text not null,
  street text not null,
  suburb text not null default '',
  city text not null,
  postal_code text not null,
  country_code text not null default 'ZA' check (country_code = 'ZA'),
  created_at timestamptz not null default now()
);
create index customer_address_customer_idx on public.customer_address(customer_id);
create table public.cart (
  cart_id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customer,
  session_token_hash text unique,
  status text not null default 'active' check (status in ('active','converted','expired')),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  check (status <> 'active' or customer_id is not null or session_token_hash is not null)
);
create unique index cart_active_customer_idx on public.cart(customer_id) where status = 'active' and customer_id is not null;
create table public.cart_item (
  cart_item_id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.cart on delete cascade,
  variant_id uuid not null references public.product_variant,
  quantity integer not null check (quantity between 1 and 99),
  unique(cart_id, variant_id)
);
create index cart_item_variant_idx on public.cart_item(variant_id);
create table public.sales_order (
  order_id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customer,
  cart_id uuid unique references public.cart,
  email_snapshot text not null,
  first_name_snapshot text not null,
  last_name_snapshot text not null,
  phone_snapshot text not null,
  street_snapshot text not null,
  suburb_snapshot text not null default '',
  city_snapshot text not null,
  postal_code_snapshot text not null,
  country_code text not null default 'ZA' check (country_code = 'ZA'),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  tax_included_cents integer not null check (tax_included_cents >= 0),
  total_cents integer not null,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled','partially_refunded','refunded')),
  placed_at timestamptz not null default now(),
  check (total_cents = subtotal_cents + shipping_cents),
  check (tax_included_cents <= total_cents)
);
create index sales_order_customer_idx on public.sales_order(customer_id, placed_at desc);
create table public.order_item (
  order_item_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_order,
  variant_id uuid not null references public.product_variant,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  colour_snapshot text not null,
  size_snapshot text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  tax_rate_snapshot numeric(5,4) not null check (tax_rate_snapshot between 0 and 1)
);
create index order_item_order_idx on public.order_item(order_id);
create index order_item_variant_idx on public.order_item(variant_id);
create table public.payment (
  payment_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_order,
  provider text not null,
  method text,
  provider_reference text,
  idempotency_key text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  status text not null default 'pending' check (status in ('pending','succeeded','failed','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_reference)
);
create index payment_order_idx on public.payment(order_id);
create table public.shipment (
  shipment_id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.sales_order,
  courier text not null,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending','shipped','delivered','exception')),
  shipped_at timestamptz,
  delivered_at timestamptz
);
create table public.service_request (
  request_id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_item,
  replacement_variant_id uuid references public.product_variant,
  request_type text not null check (request_type in ('return','exchange','repair')),
  quantity integer not null check (quantity > 0),
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','received','completed')),
  outbound_tracking text,
  inbound_tracking text,
  requested_at timestamptz not null default now(),
  received_at timestamptz,
  check (request_type = 'exchange' or replacement_variant_id is null)
);
create index service_request_item_idx on public.service_request(order_item_id);
create index service_request_variant_idx on public.service_request(replacement_variant_id);
create table public.refund (
  refund_id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment,
  request_id uuid references public.service_request,
  provider_reference text,
  idempotency_key text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),
  processed_at timestamptz
);
create index refund_payment_idx on public.refund(payment_id);
create index refund_request_idx on public.refund(request_id);
create table public.newsletter_subscriber (
  subscriber_id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  status text not null default 'pending' check (status in ('pending','subscribed','unsubscribed')),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create table public.stock_reservation (
  reservation_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_order,
  variant_id uuid not null references public.product_variant,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active','consumed','released')),
  unique(order_id, variant_id)
);
create index stock_reservation_active_idx on public.stock_reservation(variant_id, expires_at) where status = 'active';
create table public.payment_event (
  event_id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  payment_id uuid references public.payment,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, provider_event_id)
);
create index payment_event_payment_idx on public.payment_event(payment_id);

-- Default deny, including operational tables and raw inventory. Only explicit
-- read policies below are customer accessible. Service writes stay server-side.
do $$ declare t text; begin
  foreach t in array array['product','product_colour','product_variant','product_image','customer','customer_address','cart','cart_item','sales_order','order_item','payment','shipment','service_request','refund','newsletter_subscriber','stock_reservation','payment_event'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
grant select on public.product, public.product_colour, public.product_variant, public.product_image to anon, authenticated;
create policy product_public on public.product for select to anon, authenticated using (is_active);
create policy colour_public on public.product_colour for select to anon, authenticated using (exists(select 1 from public.product p where p.product_id = product_colour.product_id and p.is_active));
create policy variant_public on public.product_variant for select to anon, authenticated using (is_active and exists(select 1 from public.product_colour c where c.product_colour_id = product_variant.product_colour_id));
create policy image_public on public.product_image for select to anon, authenticated using (exists(select 1 from public.product_colour c where c.product_colour_id = product_image.product_colour_id));
grant select, insert on public.customer to authenticated;
grant update(first_name, last_name, phone) on public.customer to authenticated;
create policy customer_read on public.customer for select to authenticated using (customer_id = (select auth.uid()));
create policy customer_insert on public.customer for insert to authenticated with check (customer_id = (select auth.uid()));
create policy customer_update on public.customer for update to authenticated using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
grant select, insert, delete on public.customer_address to authenticated;
grant update(label, first_name, last_name, phone, street, suburb, city, postal_code) on public.customer_address to authenticated;
create policy address_owner on public.customer_address for all to authenticated using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
grant select on public.sales_order, public.order_item, public.shipment, public.service_request to authenticated;
create policy order_owner on public.sales_order for select to authenticated using (customer_id = (select auth.uid()));
create policy order_item_owner on public.order_item for select to authenticated using (exists(select 1 from public.sales_order o where o.order_id = order_item.order_id and o.customer_id = (select auth.uid())));
create policy shipment_owner on public.shipment for select to authenticated using (exists(select 1 from public.sales_order o where o.order_id = shipment.order_id and o.customer_id = (select auth.uid())));
create policy service_request_owner on public.service_request for select to authenticated using (exists(select 1 from public.order_item i where i.order_item_id = service_request.order_item_id));

-- Public files, administrator/service uploads only. No browser upload policy.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

-- These transaction helpers run with the caller's privileges, and only the
-- server service role may call them. The server verifies the customer JWT and
-- supplies an opaque, HttpOnly guest cookie hash; clients never supply ownership.
create function public.manage_cart(p_token_hash text, p_customer_id uuid, p_operation text, p_variant_id uuid default null, p_quantity integer default null, p_import jsonb default '[]'::jsonb)
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
      update public.cart set status = 'expired', session_token_hash = null where session_token_hash = p_token_hash;
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

create function public.create_pending_order(p_cart_id uuid, p_token_hash text, p_customer_id uuid, p_address jsonb)
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
  return new_order;
end $$;
revoke all on function public.create_pending_order(uuid,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid,text,uuid,jsonb) to service_role;
