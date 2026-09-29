-- Admin membership is managed only by the database owner, never by customers.
create table private.store_admin (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table private.store_admin enable row level security;
revoke all on private.store_admin from public, anon, authenticated;
create table public.order_tracking_event (
 event_id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.sales_order,
 stage text not null check(stage in ('processing','shipped','out_for_delivery','delivered')),
 message text not null check(length(message) between 1 and 300),
 created_at timestamptz not null default now(),
 unique(order_id,stage)
);
create index order_tracking_event_order_idx on public.order_tracking_event(order_id,created_at);
alter table public.order_tracking_event enable row level security;
revoke all on public.order_tracking_event from public,anon,authenticated;
grant select on public.order_tracking_event to authenticated;
grant all on public.order_tracking_event to service_role;
create policy tracking_owner on public.order_tracking_event for select to authenticated using(exists(select 1 from public.sales_order o where o.order_id=order_tracking_event.order_id and o.customer_id=(select auth.uid())));

create function public.is_store_admin(p_user_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.store_admin where user_id=p_user_id);
$$;
revoke all on function public.is_store_admin(uuid) from public,anon,authenticated;
grant execute on function public.is_store_admin(uuid) to service_role;

create table private.admin_audit (
 audit_id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 action text not null,
 target_id uuid not null,
 details jsonb not null,
 created_at timestamptz not null default now()
);
alter table private.admin_audit enable row level security;
revoke all on private.admin_audit from public,anon,authenticated;

create function public.admin_advance_order(p_actor uuid,p_order_id uuid,p_expected_stage text,p_stage text,p_tracking text,p_courier text,p_message text) returns void
language plpgsql security definer set search_path='' as $$
declare o public.sales_order; current_stage text; expected_next text;
begin
 if not public.is_store_admin(p_actor) then raise exception 'Admin access required'; end if;
 select * into o from public.sales_order where order_id=p_order_id for update;
 if o.order_id is null or not o.is_demo or o.status not in ('paid','processing','shipped') then raise exception 'Only active paid demo orders can be advanced'; end if;
 current_stage := o.status;
 if exists(select 1 from public.order_tracking_event where order_id=p_order_id and stage='out_for_delivery') then current_stage:='out_for_delivery'; end if;
 if current_stage is distinct from p_expected_stage then raise exception 'Order changed. Refresh and try again'; end if;
 expected_next := case current_stage when 'paid' then 'processing' when 'processing' then 'shipped' when 'shipped' then 'out_for_delivery' when 'out_for_delivery' then 'delivered' end;
 if p_stage is distinct from expected_next then raise exception 'Invalid delivery transition'; end if;
 if p_message is null or length(trim(p_message)) not between 1 and 300 then raise exception 'Update message required'; end if;
 if p_stage='shipped' and (p_tracking is null or length(trim(p_tracking)) not between 1 and 100 or p_courier is null or length(trim(p_courier)) not between 1 and 100) then raise exception 'Courier and tracking number required'; end if;
 if p_stage='shipped' then
  insert into public.shipment(order_id,courier,tracking_number,status,shipped_at) values(p_order_id,trim(p_courier),trim(p_tracking),'shipped',now())
  on conflict(order_id) do update set courier=excluded.courier,tracking_number=excluded.tracking_number,status='shipped',shipped_at=now();
 elsif p_stage='delivered' then
  update public.shipment set status='delivered',delivered_at=now() where order_id=p_order_id;
 end if;
 update public.sales_order set status=case when p_stage='out_for_delivery' then 'shipped' else p_stage end where order_id=p_order_id;
 insert into public.order_tracking_event(order_id,stage,message) values(p_order_id,p_stage,trim(p_message));
 insert into private.admin_audit(actor_id,action,target_id,details) values(p_actor,'advance_order',p_order_id,jsonb_build_object('from',current_stage,'to',p_stage));
end;
$$;
revoke all on function public.admin_advance_order(uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.admin_advance_order(uuid,uuid,text,text,text,text,text) to service_role;

create function public.admin_set_stock(p_actor uuid,p_variant_id uuid,p_expected integer,p_quantity integer) returns void
language plpgsql security definer set search_path='' as $$
declare current_quantity integer; reserved integer;
begin
 if not public.is_store_admin(p_actor) then raise exception 'Admin access required'; end if;
 if p_quantity is null or p_quantity not between 0 and 100000 then raise exception 'Invalid quantity'; end if;
 select stock_on_hand into current_quantity from public.product_variant where variant_id=p_variant_id for update;
 if current_quantity is null or current_quantity is distinct from p_expected then raise exception 'Stock changed. Refresh and try again'; end if;
 select coalesce(sum(quantity),0) into reserved from public.stock_reservation where variant_id=p_variant_id and status='active' and expires_at>now();
 if p_quantity<reserved then raise exception 'Stock cannot be lower than reserved units'; end if;
 update public.product_variant set stock_on_hand=p_quantity where variant_id=p_variant_id;
 insert into private.admin_audit(actor_id,action,target_id,details) values(p_actor,'set_stock',p_variant_id,jsonb_build_object('from',current_quantity,'to',p_quantity));
end;
$$;
revoke all on function public.admin_set_stock(uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.admin_set_stock(uuid,uuid,integer,integer) to service_role;
