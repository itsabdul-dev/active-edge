import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
const file = new URL("../.browser-test.local", import.meta.url);
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const check = (r) => {
  if (r.error) throw r.error;
  return r.data;
};
if (process.argv[2] === "create") {
  const email = `activeedge-browser-${randomUUID()}@example.invalid`,
    password = randomBytes(24).toString("hex");
  const { user } = check(
    await client.auth.admin.createUser({ email, password, email_confirm: true }),
  );
  await writeFile(file, JSON.stringify({ id: user.id, email, password }), {
    mode: 0o600,
    flag: "wx",
  });
  console.log(JSON.stringify({ email, password }));
} else if (process.argv[2] === "cart") {
  const { id } = JSON.parse(await readFile(file, "utf8"));
  const variant = check(
    await client
      .from("product_variant")
      .select("variant_id")
      .eq("sku", "PERFORMANCE-TEE-1-M")
      .single(),
  );
  check(
    await client.rpc("manage_cart", {
      p_token_hash: randomBytes(32).toString("hex"),
      p_customer_id: id,
      p_operation: "add",
      p_variant_id: variant.variant_id,
      p_quantity: 1,
    }),
  );
  console.log("Added one test item to the synthetic customer's cart.");
} else if (process.argv[2] === "cleanup") {
  const { id } = JSON.parse(await readFile(file, "utf8"));
  check(await client.from("customer_address").delete().eq("customer_id", id));
  check(await client.from("cart").delete().eq("customer_id", id));
  check(await client.from("customer").delete().eq("customer_id", id));
  check(await client.auth.admin.deleteUser(id));
  await unlink(file);
  console.log("Removed temporary browser test account.");
} else throw new Error("Use create or cleanup.");
