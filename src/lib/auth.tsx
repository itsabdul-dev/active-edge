import { AuthContext } from "./auth-context";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./supabase/browser";
import { isSupabaseConfigured } from "./supabase/config";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const client = getSupabaseBrowser();
    let alive = true;
    let revision = 0;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      revision++;
      if (alive) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    const initialRevision = revision;
    void client.auth
      .getUser()
      .then(({ data }) => {
        if (alive && revision === initialRevision) {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  const signOut = async () => {
    const { error } = await getSupabaseBrowser().auth.signOut({ scope: "local" });
    if (error) throw error;
    sessionStorage.removeItem("ae-checkout-address");
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}
