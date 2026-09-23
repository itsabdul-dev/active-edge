import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "My account | ActiveEdge" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});
const field =
  "mt-2 block w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground";
const money = (cents: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  if (loading)
    return (
      <div className="px-5 py-24 text-center" role="status">
        Loading your account…
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="eyebrow text-muted-foreground">Your ActiveEdge</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-5">
        <h1 className="text-4xl sm:text-6xl">{user ? "My account" : "Welcome back"}</h1>
        {user && (
          <button
            className="btn-outline"
            onClick={async () => {
              try {
                await signOut();
                queryClient.clear();
              } catch (e) {
                setMessage(errorMessage(e));
              }
            }}
          >
            Sign out
          </button>
        )}
      </div>
      {message && (
        <p role="alert" className="mt-5">
          {message}
        </p>
      )}
      {!isSupabaseConfigured ? (
        <p className="mt-8">
          Customer accounts are coming soon. You can still{" "}
          <Link to="/shop" className="underline">
            browse the collection
          </Link>
          .
        </p>
      ) : user ? (
        <CustomerDashboard key={user.id} userId={user.id} email={user.email ?? ""} />
      ) : (
        <AuthForm />
      )}
    </div>
  );
}
function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const client = getSupabaseBrowser();
      const email = String(form.get("email")).trim();
      const password = String(form.get("password") ?? "");
      const callback = `${window.location.origin}/auth/callback`;
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback },
        });
        if (error) throw error;
        setMessage("Check your email for a confirmation link to finish creating your account.");
      } else {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${callback}?next=reset`,
        });
        if (error) throw error;
        setMessage("If an account exists for that email, a password reset link is on its way.");
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-10 grid gap-12 md:grid-cols-2">
      <form onSubmit={submit} className="max-w-md space-y-5">
        <h2 className="text-xl">
          {mode === "login"
            ? "Sign in"
            : mode === "signup"
              ? "Create an account"
              : "Reset your password"}
        </h2>
        <label className="block text-sm">
          Email address
          <input
            className={field}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        {mode !== "forgot" && (
          <label className="block text-sm">
            Password
            <input
              className={field}
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={mode === "signup" ? 12 : 1}
              required
            />
            {mode === "signup" && (
              <span className="mt-2 block text-xs text-muted-foreground">
                Use at least 12 characters.
              </span>
            )}
          </label>
        )}
        <button className="btn-solid w-full disabled:opacity-50" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <div className="flex flex-wrap gap-5 text-sm underline">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
          >
            {mode === "signup" ? "Already have an account?" : "Create an account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "forgot" ? "login" : "forgot");
              setMessage("");
            }}
          >
            {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
          </button>
        </div>
      </form>
      <div className="bg-sand p-8 sm:p-12">
        <p className="eyebrow">Built for your next session</p>
        <h2 className="mt-5 text-3xl">Your kit. Your account.</h2>
        <p className="mt-5 leading-relaxed text-muted-foreground">
          Keep your delivery details ready, find your past orders and pick up where you left off.
        </p>
        <Link to="/shop" className="btn-outline mt-8 inline-block">
          Explore the collection
        </Link>
      </div>
    </div>
  );
}
function CustomerDashboard({ userId, email }: { userId: string; email: string }) {
  const client = getSupabaseBrowser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const account = useQuery({
    queryKey: ["account", userId],
    queryFn: async () => {
      const { error: insertError } = await client
        .from("customer")
        .upsert({ customer_id: userId }, { onConflict: "customer_id", ignoreDuplicates: true });
      if (insertError) throw insertError;
      const [profile, addresses, orders] = await Promise.all([
        client.from("customer").select("*").eq("customer_id", userId).single(),
        client.from("customer_address").select("*").eq("customer_id", userId).order("created_at"),
        client
          .from("sales_order")
          .select(
            "order_id, order_number, status, total_cents, placed_at, order_item(product_name_snapshot, colour_snapshot, size_snapshot, quantity, unit_price_cents), shipment(courier, tracking_number, status)",
          )
          .eq("customer_id", userId)
          .order("placed_at", { ascending: false })
          .limit(50),
      ]);
      for (const result of [profile, addresses, orders]) if (result.error) throw result.error;
      return { profile: profile.data!, addresses: addresses.data!, orders: orders.data! };
    },
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["account", userId] });
  if (account.isPending)
    return (
      <p className="mt-10" role="status">
        Loading your details…
      </p>
    );
  if (account.error)
    return (
      <div className="mt-10" role="alert">
        <p>We couldn’t load your account. Please try again.</p>
        <button className="btn-outline mt-4" onClick={() => void account.refetch()}>
          Retry
        </button>
      </div>
    );
  const { profile, addresses, orders } = account.data;
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { error } = await client
        .from("customer")
        .update({
          first_name: String(data["first_name"] ?? ""),
          last_name: String(data["last_name"] ?? ""),
          phone: String(data["phone"] ?? ""),
        })
        .eq("customer_id", userId);
      if (error) throw error;
      await invalidate();
      setMessage("Your profile has been saved.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-10 space-y-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="space-y-4">
          <h2 className="text-2xl">Profile</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <label className="block text-sm">
            First name
            <input
              name="first_name"
              className={field}
              defaultValue={profile["first_name"]}
              required
              maxLength={100}
              autoComplete="given-name"
            />
          </label>
          <label className="block text-sm">
            Last name
            <input
              name="last_name"
              className={field}
              defaultValue={profile["last_name"]}
              required
              maxLength={100}
              autoComplete="family-name"
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              name="phone"
              className={field}
              defaultValue={profile["phone"]}
              maxLength={30}
              autoComplete="tel"
              type="tel"
            />
          </label>
          <button className="btn-solid disabled:opacity-50" disabled={busy}>
            Save profile
          </button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </form>
        <div>
          <h2 className="text-2xl">Saved addresses</h2>
          {addresses.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Save a delivery address for your next order.
            </p>
          )}
          {addresses.map((address) => (
            <div key={address["address_id"]} className="mt-4 border border-border p-4 text-sm">
              <strong>{address["label"]}</strong>
              <p>
                {address["first_name"]} {address["last_name"]}
              </p>
              <p>
                {address["street"]}, {address["suburb"]}
              </p>
              <p>
                {address["city"]}, {address["postal_code"]}
              </p>
              <button
                className="mt-3 underline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const { error } = await client
                      .from("customer_address")
                      .delete()
                      .eq("address_id", address["address_id"])
                      .eq("customer_id", userId);
                    if (error) throw error;
                    await invalidate();
                  } catch (e) {
                    setMessage(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <AddressForm userId={userId} onSaved={invalidate} />
        </div>
      </div>
      <section className="border-t border-border pt-10">
        <h2 className="text-2xl">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            You haven’t placed an order yet.{" "}
            <Link to="/shop" className="underline">
              Find your next kit.
            </Link>
          </p>
        ) : (
          orders.map((order) => (
            <details key={order.order_id} className="mt-4 border border-border p-5">
              <summary className="cursor-pointer">
                {order.order_number} · {order.status.replaceAll("_", " ")} ·{" "}
                {money(order.total_cents)}
              </summary>
              <p className="mt-4 text-sm text-muted-foreground">
                {new Date(order.placed_at).toLocaleDateString("en-ZA")}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {order.order_item.map((item, i) => (
                  <li key={i}>
                    {item.product_name_snapshot} · {item.colour_snapshot} · {item.size_snapshot} ×{" "}
                    {item.quantity} — {money(item.unit_price_cents * item.quantity)}
                  </li>
                ))}
              </ul>
              {order.shipment && (
                <p className="mt-4 text-sm">
                  {order.shipment.courier}: {order.shipment.tracking_number ?? "Tracking pending"} ·{" "}
                  {order.shipment.status}
                </p>
              )}
            </details>
          ))
        )}
      </section>
    </div>
  );
}
function AddressForm({ userId, onSaved }: { userId: string; onSaved: () => Promise<unknown> }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm underline">Add an address</summary>
      <form
        className="mt-5 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = Object.fromEntries(new FormData(form));
          setBusy(true);
          setMessage("");
          try {
            const { error } = await getSupabaseBrowser()
              .from("customer_address")
              .insert({
                customer_id: userId,
                country_code: "ZA",
                label: String(data["label"]),
                first_name: String(data["first_name"]),
                last_name: String(data["last_name"]),
                phone: String(data["phone"]),
                street: String(data["street"]),
                suburb: String(data["suburb"] ?? ""),
                city: String(data["city"]),
                postal_code: String(data["postal_code"]),
              });
            if (error) throw error;
            await onSaved();
            form.reset();
            setMessage("Address saved.");
          } catch (e) {
            setMessage(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {(
          [
            ["label", "Address label"],
            ["first_name", "First name"],
            ["last_name", "Last name"],
            ["phone", "Phone"],
            ["street", "Street address"],
            ["suburb", "Suburb"],
            ["city", "City"],
            ["postal_code", "Postal code"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="block text-sm">
            {label}
            <input name={name} className={field} required={name !== "suburb"} maxLength={200} />
          </label>
        ))}
        <p className="text-sm text-muted-foreground">South Africa</p>
        <button className="btn-solid disabled:opacity-50" disabled={busy}>
          Save address
        </button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
