"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getKennelMembership, isAdmin } from "@/lib/supabase/auth";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Incorrect email or password." };
  }

  if (await isAdmin(data.user.id)) {
    redirect("/admin");
  }

  const membership = await getKennelMembership(data.user.id);
  if (membership) {
    redirect("/dashboard");
  }

  // El usuario existe en Supabase Auth pero no está vinculado a ningún
  // kennel ni es admin: no le dejamos una sesión activa sin acceso.
  await supabase.auth.signOut();
  return {
    error: "Your account doesn't have access to any kennel. Contact the administrator.",
  };
}
