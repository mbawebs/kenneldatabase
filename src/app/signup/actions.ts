"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface SignUpState {
  error: string | null;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "kennel"
  );
}

async function uniqueSlug(
  serviceRole: ReturnType<typeof createServiceRoleClient>,
  base: string
): Promise<string> {
  let slug = base;
  for (let attempt = 2; attempt <= 30; attempt++) {
    const { data } = await serviceRole
      .from("kennels")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${attempt}`;
  }
  // Extremadamente improbable (30 kennels con el mismo nombre base):
  // se rescata con un sufijo aleatorio en vez de fallar.
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

// Unico punto de entrada publico a service-role en toda la app: lo
// usa cualquier visitante sin cuenta, no solo admins (a diferencia
// de todo lo demas en createServiceRoleClient). Por eso hace
// exactamente 3 escrituras, nada mas — crea el usuario, su kennel
// (siempre plan 'free', nunca lee eso de formData), y el vinculo
// entre ambos — y revierte lo que ya alcanzo a crear si un paso
// posterior falla, para no dejar cuentas o kennels huerfanos.
export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const kennelName = String(formData.get("kennel_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!kennelName) {
    return { error: "Enter your kennel's name." };
  }
  if (!email) {
    return { error: "Enter your email." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const serviceRole = createServiceRoleClient();
  const slug = await uniqueSlug(serviceRole, slugify(kennelName));

  // 1. Crear el usuario en Supabase Auth. email_confirm: true lo deja
  // confirmado de inmediato (sin correo de verificacion) para que el
  // registro sea de un solo paso hasta /dashboard, igual que ya hace
  // createKennelUser cuando un admin da de alta a un dueño a mano.
  const { data: createdUser, error: createUserError } =
    await serviceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError || !createdUser.user) {
    if (createUserError?.message.toLowerCase().includes("already")) {
      return { error: "An account with that email already exists." };
    }
    return { error: "Could not create your account. Try again." };
  }

  const userId = createdUser.user.id;

  // 2. Crear su kennel: siempre plan 'free', siempre activo, siempre
  // owner_id = este mismo usuario (la policy de RLS tambien exige
  // esto — ver kennels_insert_admin_or_self_signup — asi que aunque
  // esta linea se editara mal, la base de datos igual lo rechazaria
  // para cualquier insert que no venga de aqui via service-role).
  const { data: kennel, error: kennelError } = await serviceRole
    .from("kennels")
    .insert({
      name: kennelName,
      slug,
      status: "active",
      plan: "free",
      owner_id: userId,
    })
    .select("id")
    .single();

  if (kennelError || !kennel) {
    await serviceRole.auth.admin.deleteUser(userId);
    return { error: "Could not create your kennel. Try again." };
  }

  // 3. Vincular al usuario con su nuevo kennel.
  const { error: linkError } = await serviceRole.from("kennel_users").insert({
    user_id: userId,
    kennel_id: kennel.id,
    role: "editor",
  });

  if (linkError) {
    await serviceRole.from("kennels").delete().eq("id", kennel.id);
    await serviceRole.auth.admin.deleteUser(userId);
    return { error: "Could not finish setting up your account. Try again." };
  }

  // 4. Iniciar sesion de verdad (cookies via el cliente SSR) para
  // que /dashboard ya lo reciba logueado, sin pedirle que haga login
  // aparte.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/login");
  }

  redirect("/dashboard");
}
