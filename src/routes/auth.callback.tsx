import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Confirm account | ActiveEdge" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthCallback,
});
let pendingExchange: Promise<void> | undefined;
function AuthCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    const reset = params.get("next") === "reset" || type === "recovery";
    pendingExchange ??= (async () => {
      const client = getSupabaseBrowser();
      if (params.has("error"))
        throw new Error("This link is invalid or has expired. Please request a new one.");
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else if (tokenHash && (type === "email" || type === "signup" || type === "recovery")) {
        const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) throw error;
      } else throw new Error("This confirmation link is incomplete. Please request a new one.");
      window.history.replaceState({}, "", "/auth/callback");
      window.location.replace(reset ? "/reset-password" : "/account");
    })();
    void pendingExchange.catch(() => {
      setError(
        "This link could not be verified. It may have expired, or it may need to be opened in the browser where you requested it. Please request a new link.",
      );
      pendingExchange = undefined;
    });
  }, []);
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <h1 className="text-3xl">Confirming your account</h1>
      <p className="mt-5" role={error ? "alert" : "status"}>
        {error || "Verifying your link…"}
      </p>
      {error && (
        <Link className="btn-solid mt-8 inline-block" to="/account">
          Return to account
        </Link>
      )}
    </div>
  );
}
