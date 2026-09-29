import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("ERD constraints, customer isolation, cart ownership, checkout totals and stock reservations", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    `);
    for (const file of (await readdir("supabase/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    const one = "11111111-1111-4111-8111-111111111111",
      two = "22222222-2222-4222-8222-222222222222";
    await db.query("insert into auth.users values($1),($2)", [one, two]);
    const asRole = async (role, id, fn) => {
      await db.exec(`begin; set local role ${role};`);
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id ?? ""]);
      try {
        const result = await fn();
        await db.exec("commit");
        return result;
      } catch (e) {
        await db.exec("rollback");
        throw e;
      }
    };
    const consume = (role = "service_role") =>
      asRole(role, null, () =>
        db.query("select public.consume_request_limit($1,2,60) as allowed", ["c".repeat(64)]),
      );
    assert.equal((await consume()).rows[0].allowed, true);
    assert.equal((await consume()).rows[0].allowed, true);
    assert.equal((await consume()).rows[0].allowed, false);
    await assert.rejects(consume("anon"), /permission denied/);
    await assert.rejects(
      asRole("authenticated", one, () => db.query("select * from private.request_limit")),
      /permission denied/,
    );
    await db.query("update private.request_limit set expires_at=now()-interval '1 second'");
    assert.equal((await consume()).rows[0].allowed, true);
    await asRole("authenticated", one, () =>
      db.query("insert into public.customer(customer_id,first_name) values($1,$2)", [one, "First"]),
    );
    await asRole("authenticated", two, () =>
      db.query("insert into public.customer(customer_id,first_name) values($1,$2)", [
        two,
        "Second",
      ]),
    );
    const visible = await asRole("authenticated", one, () =>
      db.query("select customer_id from public.customer"),
    );
    assert.deepEqual(
      visible.rows.map((r) => r.customer_id),
      [one],
    );
    await assert.rejects(
      asRole("authenticated", one, () =>
        db.query(
          "insert into public.customer_address(customer_id,first_name,last_name,phone,street,city,postal_code) values($1,'a','b','1','street','city','8000')",
          [two],
        ),
      ),
      /row-level security/,
    );
    await assert.rejects(
      asRole("authenticated", one, () =>
        db.query("update public.customer set customer_id=$1 where customer_id=$2", [two, one]),
      ),
      /permission denied/,
    );
    await assert.rejects(
      asRole("anon", null, () => db.query("select * from public.customer")),
      /permission denied/,
    );
    const product = (
      await db.query(
        "insert into public.product(slug,name,audience) values('tee','Tee','men') returning product_id",
      )
    ).rows[0].product_id;
    const colour = (
      await db.query(
        "insert into public.product_colour(product_id,colour_name) values($1,'Black') returning product_colour_id",
        [product],
      )
    ).rows[0].product_colour_id;
    const variant = (
      await db.query(
        "insert into public.product_variant(product_colour_id,sku,size_code,price_cents,stock_on_hand) values($1,'TEE-BLK-M','M',29900,3) returning variant_id",
        [colour],
      )
    ).rows[0].variant_id;
    await assert.rejects(
      db.query(
        "insert into public.product_variant(product_colour_id,sku,size_code,price_cents) values($1,'OTHER','M',100)",
        [colour],
      ),
      /unique/,
    );
    await assert.rejects(
      db.query("update public.product_variant set stock_on_hand=-1 where variant_id=$1", [variant]),
      /check constraint/,
    );
    await assert.rejects(
      asRole("authenticated", one, () =>
        db.query("update public.product_variant set price_cents=1"),
      ),
      /permission denied/,
    );
    await assert.rejects(
      asRole("anon", null, () =>
        db.query("select public.manage_cart($1,null,'load')", ["a".repeat(64)]),
      ),
      /permission denied/,
    );
    const manage = (hash, customer, operation, qty = 1) =>
      asRole(
        "service_role",
        null,
        async () =>
          (
            await db.query("select public.manage_cart($1,$2,$3,$4,$5) as cart", [
              hash,
              customer,
              operation,
              variant,
              qty,
            ])
          ).rows[0].cart,
      );
    const guest = await manage("a".repeat(64), null, "add", 2);
    assert.equal(guest.lines[0].price, 299);
    assert.equal(guest.lines[0].qty, 2);
    const merged = await manage("a".repeat(64), one, "load");
    assert.equal(merged.lines[0].qty, 2);
    const repeated = await manage("a".repeat(64), one, "load");
    assert.equal(repeated.lines[0].qty, 2, "guest merge must not duplicate items");
    const other = await manage("b".repeat(64), two, "add", 2);
    const address = {
      email: "test@example.invalid",
      unit: "Apartment 4",
      delivery_instructions: "Leave with reception",
      first_name: "Test",
      last_name: "Customer",
      phone: "000",
      street: "Test street",
      city: "Cape Town",
      postal_code: "8000",
    };
    const order = (cartId, hash, customer) =>
      asRole(
        "service_role",
        null,
        async () =>
          (
            await db.query("select public.create_pending_order($1,$2,$3,$4) as id", [
              cartId,
              hash,
              customer,
              address,
            ])
          ).rows[0].id,
      );
    await assert.rejects(order(merged.cartId, "b".repeat(64), two), /Cart unavailable/);
    const orderId = await order(merged.cartId, "a".repeat(64), one);
    assert.equal(
      await order(merged.cartId, "a".repeat(64), one),
      orderId,
      "retry returns the original order",
    );
    const saved = (await db.query("select * from public.sales_order where order_id=$1", [orderId]))
      .rows[0];
    assert.equal(saved.unit_snapshot, "Apartment 4");
    assert.equal(saved.delivery_instructions_snapshot, "Leave with reception");
    assert.equal(saved.subtotal_cents, 59800);
    assert.equal(saved.shipping_cents, 8500);
    assert.equal(saved.total_cents, 68300);
    assert.equal(saved.tax_included_cents, 8909);
    await assert.rejects(order(other.cartId, "b".repeat(64), two), /Insufficient stock/);
    assert.equal(
      (await asRole("authenticated", two, () => db.query("select * from public.sales_order"))).rows
        .length,
      0,
    );
    assert.equal(
      (await asRole("authenticated", two, () => db.query("select * from public.order_item"))).rows
        .length,
      0,
    );
    assert.equal(
      (await asRole("authenticated", one, () => db.query("select * from public.order_item"))).rows
        .length,
      1,
    );
    await assert.rejects(
      asRole("authenticated", one, () => db.query("update public.sales_order set status='paid'")),
      /permission denied/,
    );
    await db.query(
      "update public.stock_reservation set expires_at=now()-interval '1 second' where order_id=$1",
      [orderId],
    );
    assert.ok(
      await order(other.cartId, "b".repeat(64), two),
      "expired reservations release availability",
    );
    await db.query("update public.product_variant set stock_on_hand=10 where variant_id=$1", [
      variant,
    ]);
    await manage("e".repeat(64), null, "add", 1);
    const pay = (id, outcome, hash = "e".repeat(64), total = 38400, role = "service_role") =>
      asRole(
        role,
        null,
        async () =>
          (
            await db.query(
              "select public.simulate_payment($1,$2,null,$3,$4,'card','Visa','1111',$5) as result",
              [id, hash, address, outcome, total],
            )
          ).rows[0].result,
      );
    const attempt = "33333333-3333-4333-8333-333333333333";
    const failedAttempt = "44444444-4444-4444-8444-444444444444";
    await assert.rejects(pay(attempt, "approved", "e".repeat(64), 1), /Price changed/);
    await assert.rejects(
      pay(attempt, "approved", "e".repeat(64), 38400, "anon"),
      /permission denied/,
    );
    assert.equal((await pay(failedAttempt, "declined")).status, "declined");
    assert.equal((await manage("e".repeat(64), null, "load")).lines.length, 1);
    const receipt = await pay(attempt, "approved");
    assert.equal(receipt.status, "approved");
    assert.match(receipt.orderNumber, /^AE-\d{4}-\d{6,}$/);
    assert.deepEqual(await pay(attempt, "approved"), receipt);
    const recover = (hash) =>
      asRole(
        "service_role",
        null,
        async () =>
          (await db.query("select public.get_demo_payment($1,$2,null) as result", [attempt, hash]))
            .rows[0].result,
      );
    assert.deepEqual(await recover("e".repeat(64)), receipt);
    assert.equal(await recover("f".repeat(64)), null);

    await assert.rejects(pay(attempt, "approved", "f".repeat(64)), /Payment unavailable/);
    assert.equal(
      (
        await db.query("select stock_on_hand from public.product_variant where variant_id=$1", [
          variant,
        ])
      ).rows[0].stock_on_hand,
      9,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from public.payment where is_demo")).rows[0].n,
      1,
    );
    assert.equal(
      (await manage("e".repeat(64), null, "load")).lines.length,
      0,
      "new guest cart after payment",
    );
    assert.deepEqual(
      await recover("e".repeat(64)),
      receipt,
      "guest receipt remains accessible after a new cart is created",
    );
    const advance = (actor, expected, next, role = "service_role") =>
      asRole(role, actor, () =>
        db.query(
          "select public.admin_advance_order($1,$2,$3,$4,'AE-DEMO-123','ActiveEdge Demo Courier','Demo delivery update')",
          [actor, receipt.orderId, expected, next],
        ),
      );
    await assert.rejects(advance(two, "paid", "processing"), /Admin access required/);
    await db.query("insert into private.store_admin(user_id) values($1)", [one]);
    await assert.rejects(advance(one, "paid", "processing", "authenticated"), /permission denied/);
    await assert.rejects(
      asRole("authenticated", two, () =>
        db.query("insert into private.store_admin(user_id) values($1)", [two]),
      ),
      /permission denied/,
    );
    await assert.rejects(advance(one, "paid", "delivered"), /Invalid delivery transition/);
    await advance(one, "paid", "processing");
    await assert.rejects(advance(one, "paid", "processing"), /Order changed/);
    await advance(one, "processing", "shipped");
    await advance(one, "shipped", "out_for_delivery");
    await advance(one, "out_for_delivery", "delivered");
    assert.equal(
      (await db.query("select status from public.shipment where order_id=$1", [receipt.orderId]))
        .rows[0].status,
      "delivered",
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.order_tracking_event where order_id=$1",
          [receipt.orderId],
        )
      ).rows[0].n,
      4,
    );
    await db.query("update public.sales_order set customer_id=$1 where order_id=$2", [
      one,
      receipt.orderId,
    ]);
    assert.equal(
      (
        await asRole("authenticated", two, () =>
          db.query("select * from public.order_tracking_event"),
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await asRole("authenticated", one, () =>
          db.query("select * from public.order_tracking_event"),
        )
      ).rows.length,
      4,
    );
    await assert.rejects(
      asRole("authenticated", one, () =>
        db.query("update public.order_tracking_event set message='tampered'"),
      ),
      /permission denied/,
    );
    await assert.rejects(
      asRole("service_role", null, () =>
        db.query("select public.admin_set_stock($1,$2,9,50)", [two, variant]),
      ),
      /Admin access required/,
    );
    await asRole("service_role", null, () =>
      db.query("select public.admin_set_stock($1,$2,9,50)", [one, variant]),
    );
    await assert.rejects(
      asRole("service_role", null, () =>
        db.query("select public.admin_set_stock($1,$2,9,60)", [one, variant]),
      ),
      /Stock changed/,
    );
    assert.equal(
      (await db.query("select count(*)::int as n from private.admin_audit")).rows[0].n,
      5,
      "successful admin updates are audited",
    );
    await db.query("update private.payment_demo_settings set enabled=false");
    await assert.rejects(pay(attempt, "approved"), /Demo payments disabled/);
    await db.query("update public.product set is_active=false where product_id=$1", [product]);
    const hidden = await asRole("anon", null, () =>
      db.query("select * from public.product_variant"),
    );
    assert.equal(hidden.rows.length, 0);
    const rls = await db.query(
      "select relname from pg_class c join pg_namespace n on c.relnamespace=n.oid where n.nspname='public' and relkind='r' and not relrowsecurity",
    );
    assert.equal(rls.rows.length, 0, "all public tables require RLS");
  } finally {
    await db.close();
  }
});
