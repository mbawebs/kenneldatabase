import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Cliente para Server Components, Server Actions y Route Handlers: lee
// la sesión desde las cookies de la petición actual, así las queries
// respetan RLS como el usuario que está logueado (no como anónimo).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Un Server Component no puede escribir cookies (solo Server
          // Actions y Route Handlers pueden). Si esto se llama desde un
          // Server Component, lo ignoramos: src/proxy.ts se encarga de
          // refrescar y guardar la sesión en cada peticion.
        }
      },
    },
  });
}
