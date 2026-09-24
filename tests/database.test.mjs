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
