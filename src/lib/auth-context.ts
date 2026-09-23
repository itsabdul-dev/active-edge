import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
type AuthState = { user: User | null; loading: boolean; signOut: () => Promise<void> };
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
