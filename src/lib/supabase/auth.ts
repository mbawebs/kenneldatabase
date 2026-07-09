import "server-only";
import { createClient } from "./server";

// getUser() valida el token contra Supabase en cada llamada. No usamos
// getSession(), que solo lee la cookie sin verificarla.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getKennelMembership(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kennel_users")
    .select("kennel_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data;
}
