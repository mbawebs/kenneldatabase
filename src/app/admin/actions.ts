"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import { KENNEL_PLANS, type KennelPlan } from "@/lib/supabase/types";

// Cada acción vuelve a verificar admin por su cuenta: no basta con que
// la página /admin ya lo haya revisado al renderizar (un Server Action
// es un endpoint POST alcanzable directamente, no solo un botón en una
// página protegida).
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin(user.id))) {
    redirect("/login");
  }
  return user;
}

export interface CreateKennelState {
  error: string | null;
  success?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createKennel(
  _prevState: CreateKennelState,
  formData: FormData
): Promise<CreateKennelState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !slug) {
    return { error: "Name and slug are required." };
  }

  const plan = String(formData.get("plan") ?? "demo").trim();
  if (!KENNEL_PLANS.includes(plan as KennelPlan)) {
    return { error: "Invalid plan." };
  }

  // El formulario genera este id en el navegador (crypto.randomUUID())
  // ANTES de crear el kennel, para poder subir el logo/portada a esa
  // carpeta de Storage de inmediato (como admin, esa subida ya está
  // permitida aunque el kennel todavía no exista en la base de datos).
  // Aquí solo validamos el formato; si falta o está corrupto,
  // dejamos que la base de datos genere uno nuevo (las imágenes ya
  // subidas quedarían huérfanas, pero es un caso raro).
  const submittedId = String(formData.get("id") ?? "").trim();
  const id = UUID_RE.test(submittedId) ? submittedId : undefined;

  const optional = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value === "" ? null : value;
  };

  const supabase = await createClient();
  const { error } = await supabase.from("kennels").insert({
    ...(id ? { id } : {}),
    name,
    slug,
    logo_url: optional("logo_url"),
    cover_photo_url: optional("cover_photo_url"),
    description: optional("description"),
    country: optional("country"),
    city: optional("city"),
    phone: optional("phone"),
    email: optional("email"),
    status: optional("status") ?? "active",
    plan,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `A kennel with the slug "${slug}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { error: null, success: true };
}

export async function toggleKennelStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");
  if (!id || !nextStatus) return;

  const supabase = await createClient();
  await supabase.from("kennels").update({ status: nextStatus }).eq("id", id);

  revalidatePath("/admin");
}

export interface SetFeaturedPositionState {
  error: string | null;
  success?: boolean;
  conflict: { position: number; kennelName: string } | null;
}

// "featured_position" solo se toca desde aqui — no existe ningun
// input para este campo en KennelInfoForm/updateKennel (el formulario
// que usan tanto /dashboard como /admin/kennels/[id]), asi que el
// dueño del kennel no tiene forma de asignarse una posicion.
//
// Dos capas contra posiciones duplicadas:
// 1. Aqui: antes de escribir, se busca si otro kennel ya tiene esa
//    posicion. Si lo hay y "force" no vino en true, se corta sin
//    escribir nada y se regresa el conflicto (posicion + nombre del
//    que la tiene) para que el admin decida en la UI. Si "force" es
//    true, se libera la posicion del otro kennel primero (dos updates
//    secuenciales, no una transaccion — ver migracion) y luego se
//    asigna al kennel actual.
// 2. En la base de datos: un indice unico parcial en
//    kennels.featured_position (solo aplica a filas no-null) es la
//    garantia real contra duplicados — si por una condicion de
//    carrera dos admins asignan la misma posicion casi al mismo
//    tiempo, Postgres rechaza el segundo write con un error 23505,
//    que se atrapa mas abajo como red de seguridad.
export async function setKennelFeaturedPosition(
  _prevState: SetFeaturedPositionState,
  formData: FormData
): Promise<SetFeaturedPositionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const positionRaw = String(formData.get("position") ?? "");
  const force = formData.get("force") === "true";
  if (!id) return { error: "Missing kennel id.", conflict: null };

  let position: number | null = null;
  if (positionRaw) {
    position = Number(positionRaw);
    if (!Number.isInteger(position) || position < 1 || position > 6) {
      return { error: "Invalid position.", conflict: null };
    }
  }

  const supabase = await createClient();

  if (position !== null) {
    const { data: holder } = await supabase
      .from("kennels")
      .select("id, name")
      .eq("featured_position", position)
      .neq("id", id)
      .maybeSingle();

    if (holder) {
      if (!force) {
        return {
          error: null,
          conflict: { position, kennelName: holder.name },
        };
      }
      await supabase
        .from("kennels")
        .update({ featured_position: null })
        .eq("id", holder.id);
    }
  }

  const { error } = await supabase
    .from("kennels")
    .update({ featured_position: position })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "That position was just taken by another kennel — try again.",
        conflict: null,
      };
    }
    return { error: error.message, conflict: null };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { error: null, success: true, conflict: null };
}

export interface CreateKennelUserState {
  error: string | null;
  success?: boolean;
}

export async function createKennelUser(
  _prevState: CreateKennelUserState,
  formData: FormData
): Promise<CreateKennelUserState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const kennelId = String(formData.get("kennel_id") ?? "");

  if (!email || !password || !kennelId) {
    return { error: "Email, password, and kennel are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // Crear usuarios en Supabase Auth requiere la clave service_role: la
  // clave anon (la que usa el resto de la app) no tiene permiso para
  // esto por diseño de Supabase.
  const serviceRole = createServiceRoleClient();

  const { data: createdUser, error: createUserError } =
    await serviceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError || !createdUser.user) {
    return {
      error: createUserError?.message ?? "Could not create the user.",
    };
  }

  const { error: linkError } = await serviceRole.from("kennel_users").insert({
    user_id: createdUser.user.id,
    kennel_id: kennelId,
    role: "editor",
  });

  if (linkError) {
    // Si no se pudo vincular al kennel, no dejamos un usuario huérfano
    // sin acceso a nada.
    await serviceRole.auth.admin.deleteUser(createdUser.user.id);
    return {
      error: `Could not link the user to the kennel: ${linkError.message}`,
    };
  }

  revalidatePath("/admin");
  return { error: null, success: true };
}

export interface ResetPasswordState {
  error: string | null;
  success?: boolean;
}

// Para cuando un dueño de kennel olvida su contraseña y escribe a
// contactar administración: el admin le asigna una temporal aqui
// mismo, sin necesitar (ni poder) conocer la anterior — mismo
// mecanismo de service-role que createKennelUser.
export async function resetKennelUserPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId) {
    return { error: "Missing user id." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const serviceRole = createServiceRoleClient();
  const { error } = await serviceRole.auth.admin.updateUserById(userId, {
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, success: true };
}

export interface UpdateSiteSettingsState {
  error: string | null;
  success?: boolean;
}

export async function updateSiteSettings(
  _prevState: UpdateSiteSettingsState,
  formData: FormData
): Promise<UpdateSiteSettingsState> {
  await requireAdmin();

  const optional = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value === "" ? null : value;
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_image_url: optional("hero_image_url"),
      top_banner_text: optional("top_banner_text"),
      top_banner_link: optional("top_banner_link"),
      banner_left_image_url: optional("banner_left_image_url"),
      banner_left_link: optional("banner_left_link"),
      banner_right_image_url: optional("banner_right_image_url"),
      banner_right_link: optional("banner_right_link"),
      mobile_banner_top_image_url: optional("mobile_banner_top_image_url"),
      mobile_banner_top_link: optional("mobile_banner_top_link"),
      mobile_banner_bottom_image_url: optional("mobile_banner_bottom_image_url"),
      mobile_banner_bottom_link: optional("mobile_banner_bottom_link"),
    })
    .eq("id", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { error: null, success: true };
}
