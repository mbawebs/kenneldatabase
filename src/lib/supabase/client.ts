import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Cliente para Client Components ("use client"): guarda la sesión en
// cookies (no en localStorage) para que el servidor también pueda leerla.
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
