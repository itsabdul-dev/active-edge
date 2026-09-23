import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password | ActiveEdge" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});
function ResetPassword() {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <div className="mx-auto max-w-lg px-5 py-20">
      <h1 className="text-3xl">Choose a new password</h1>
      {loading ? (
        <p className="mt-5" role="status">
          Checking your reset link…
        </p>
      ) : !user ? (
        <p className="mt-5">
          Open the link in your password reset email, or{" "}
          <Link to="/account" className="underline">
            request a new one
          </Link>
          .
        </p>
      ) : done ? (
        <p className="mt-5">
          Password updated.{" "}
          <Link className="underline" to="/account">
            Return to your account.
          </Link>
        </p>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const password = String(data.get("password"));
            if (password !== data.get("confirm")) {
              setMessage("Passwords must match.");
              return;
            }
            setBusy(true);
            setMessage("");
            try {
              const { error } = await getSupabaseBrowser().auth.updateUser({ password });
              if (error) throw error;
              setDone(true);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Unable to update password.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm">
            New password
            <input
              className="mt-2 w-full border border-border p-3"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <label className="block text-sm">
            Confirm password
            <input
              className="mt-2 w-full border border-border p-3"
              type="password"
              name="confirm"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
          <button disabled={busy} className="btn-solid w-full disabled:opacity-50">
            {busy ? "Saving…" : "Update password"}
          </button>
          {message && <p role="alert">{message}</p>}
        </form>
      )}
    </div>
  );
}
