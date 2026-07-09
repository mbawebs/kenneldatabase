import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con privilegios totales: se salta RLS por completo.
// SOLO se debe usar dentro de Server Actions que ya verificaron que
// quien llama es super-admin (ver isAdmin en ./auth). El import de
// "server-only" hace que el build falle si esto llegara a importarse
// por accidente desde un Client Component.
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (see Settings > API in the Supabase dashboard)."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
