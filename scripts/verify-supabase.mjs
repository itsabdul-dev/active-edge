import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const url = process.env.VITE_SUPABASE_URL,
  key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !key || !secret) throw new Error("Load ActiveEdge .env.local first.");
if (new URL(url).hostname !== "mfzpfhwzyxrajzdjpsby.supabase.co")
  throw new Error("Unexpected project.");
const client = (token) =>
  createClient(url, token, { auth: { persistSession: false, autoRefreshToken: false } });
const admin = client(secret),
  anon = client(key);
const created = [];
const check = (r) => {
  if (r.error) throw r.error;
  return r.data;
};
try {
  const products = check(
    await anon
      .from("product")
      .select(
        "product_id, product_colour(product_image(storage_path), product_variant(variant_id))",
      ),
  );
  assert.equal(products.length, 11);
  const photos = products.flatMap((p) => p.product_colour.flatMap((c) => c.product_image));
  assert.equal(photos.length, 25);
  const photo = anon.storage.from("product-images").getPublicUrl(photos[0].storage_path)
    .data.publicUrl;
  assert.equal((await fetch(photo, { method: "HEAD" })).status, 200);
  assert.ok((await anon.from("customer").select("*")).error);
  assert.ok((await anon.from("payment").select("*")).error);
  assert.ok(
    (
      await anon.rpc("manage_cart", {
        p_token_hash: "a".repeat(64),
        p_customer_id: null,
        p_operation: "load",
      })
    ).error,
  );
  const makeUser = async () => {
    const email = `activeedge-test-${randomUUID()}@example.invalid`,
      password = `${randomBytes(24).toString("hex")}aA1!`;
    const { user } = check(
      await admin.auth.admin.createUser({ email, password, email_confirm: true }),
    );
    created.push(user.id);
    const browser = client(key);
    check(await browser.auth.signInWithPassword({ email, password }));
    check(
      await browser
        .from("customer")
        .upsert({ customer_id: user.id }, { onConflict: "customer_id", ignoreDuplicates: true }),
    );
    check(
      await browser
        .from("customer")
        .upsert({ customer_id: user.id }, { onConflict: "customer_id", ignoreDuplicates: true }),
    );
    check(await browser.from("customer").update({ first_name: "Test" }).eq("customer_id", user.id));
    return { browser, user };
  };
  const first = await makeUser(),
    second = await makeUser();
  assert.equal(check(await first.browser.from("customer").select("*")).length, 1);
  assert.equal(
    check(await second.browser.from("customer").select("*").eq("customer_id", first.user.id))
      .length,
    0,
  );
  assert.ok(
    (
      await second.browser
        .from("customer_address")
        .insert({
          customer_id: first.user.id,
          label: "Test",
          first_name: "Test",
          last_name: "Test",
          phone: "0",
          street: "Test",
          city: "Test",
          postal_code: "8000",
        })
    ).error,
  );
  const address = check(
    await first.browser
      .from("customer_address")
      .insert({
        customer_id: first.user.id,
        label: "Test",
        first_name: "Test",
        last_name: "Test",
        phone: "0",
        street: "Test",
        city: "Test",
        postal_code: "8000",
      })
      .select("address_id")
      .single(),
  );
  assert.equal(
    check(
      await second.browser
        .from("customer_address")
        .select("*")
        .eq("address_id", address.address_id),
    ).length,
    0,
  );
  const variant = products[0].product_colour[0].product_variant[0].variant_id;
  assert.ok(
    (
      await first.browser
        .from("product_variant")
        .update({ price_cents: 1 })
        .eq("variant_id", variant)
    ).error,
  );
  const hash = createHash("sha256").update(randomBytes(32)).digest("hex");
  const cart = check(
    await admin.rpc("manage_cart", {
      p_token_hash: hash,
      p_customer_id: first.user.id,
      p_operation: "add",
      p_variant_id: variant,
      p_quantity: 1,
    }),
  );
  assert.equal(cart.lines.length, 1);
  assert.equal(cart.lines[0].qty, 1);
  assert.ok((await first.browser.from("cart").select("*")).error);
  check(await first.browser.auth.signOut());
  assert.ok((await first.browser.from("customer").select("*")).error);
  const generated = check(
    await admin.auth.admin.generateLink({ type: "recovery", email: second.user.email }),
  );
  const recovery = client(key);
  check(
    await recovery.auth.verifyOtp({
      token_hash: generated.properties.hashed_token,
      type: "recovery",
    }),
  );
  const resetPassword = randomBytes(24).toString("hex");
  check(await recovery.auth.updateUser({ password: resetPassword }));
  check(await recovery.auth.signOut());
  check(
    await recovery.auth.signInWithPassword({ email: second.user.email, password: resetPassword }),
  );
  check(await recovery.auth.signOut());
  check(await second.browser.auth.signOut());
  console.log(
    "PASS: live catalogue, public photo, signup/login/profile, saved addresses, RLS isolation, service-only cart, password recovery and logout.",
  );
} finally {
  // Only remove the synthetic users and rows created by this run.
  for (const id of created) {
    check(await admin.from("customer_address").delete().eq("customer_id", id));
    check(await admin.from("cart").delete().eq("customer_id", id));
    check(await admin.from("customer").delete().eq("customer_id", id));
    check(await admin.auth.admin.deleteUser(id));
  }
  console.log(`Removed ${created.length} temporary verification accounts.`);
}
