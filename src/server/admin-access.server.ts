import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server.server";
export async function adminIdentity() {
  const {
    data: { user },
    error,
  } = await getSupabaseServer().auth.getUser();
  if (error || !user) return null;
  const { data: allowed, error: denied } = await getSupabaseAdmin().rpc("is_store_admin", {
    p_user_id: user.id,
  });
  if (denied || !allowed) return null;
  return user.id;
}
export async function requireAdmin() {
  const id = await adminIdentity();
  if (!id) throw new Error("Admin access required. Sign in with your authorised account.");
  return id;
}
