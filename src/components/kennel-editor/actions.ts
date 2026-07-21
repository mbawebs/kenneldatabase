"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getKennelMembership, isAdmin as checkIsAdmin } from "@/lib/supabase/auth";
import {
  KENNEL_PLANS,
  SOCIAL_PLATFORMS,
  type DogCategory,
  type KennelPlan,
  type SocialLink,
} from "@/lib/supabase/types";
import {
  categoryGroupCategories,
  FREE_PLAN_AVAILABLE_MESSAGE,
  FREE_PLAN_BREEDINGS_MESSAGE,
  FREE_PLAN_DOG_LIMIT,
  freePlanDogLimitMessage,
  FROZEN_PLAN_MESSAGE,
  isFreePlan,
  isFrozenPlan,
} from "@/lib/plan-limits";

const DOG_CATEGORIES: DogCategory[] = [
  "stud",
  "female",
  "available",
  "production",
  "puppy",
];

// Autoriza a: super-admins (cualquier kennel) o miembros de ESE kennel
// especifico. El kennel_id puede venir de un campo oculto del
// formulario (por ejemplo cuando un admin edita el kennel de otro),
// pero nunca se usa "a ciegas": esta funcion siempre re-verifica la
// sesion real antes de dejar pasar la operacion. Tambien devuelve si
// el acceso fue por ser admin, para que las acciones puedan decidir
// si aplican cambios reservados a admins (como el plan).
async function requireKennelAccess(
  kennelId: string
): Promise<{ isAdmin: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (await checkIsAdmin(user.id)) {
    return { isAdmin: true };
  }

  const membership = await getKennelMembership(user.id);
  if (!membership || membership.kennel_id !== kennelId) {
    redirect("/login");
  }

  return { isAdmin: false };
}

function optionalField(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

// Se llama antes de crear/mover un perro hacia "category" en un
// kennel plan 'free'. "available" esta bloqueado por completo;
// stud/female/production+puppy tienen tope de FREE_PLAN_DOG_LIMIT
// cada uno. excludeDogId se usa al editar un perro ya existente, para
// no contarlo dos veces contra si mismo (asi un kennel que bajo de
// PRO a free con mas perros de los que el plan permite puede seguir
// editando los que ya tiene, solo no puede agregar mas).
async function checkFreePlanDogLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kennelId: string,
  category: DogCategory,
  excludeDogId?: string
): Promise<string | null> {
  if (category === "available") {
    return FREE_PLAN_AVAILABLE_MESSAGE;
  }

  let query = supabase
    .from("dogs")
    .select("id", { count: "exact", head: true })
    .eq("kennel_id", kennelId)
    .in("category", categoryGroupCategories(category));
  if (excludeDogId) {
    query = query.neq("id", excludeDogId);
  }
  const { count } = await query;

  if ((count ?? 0) >= FREE_PLAN_DOG_LIMIT) {
    return freePlanDogLimitMessage();
  }
  return null;
}

export interface UpdateKennelState {
  error: string | null;
  success?: boolean;
}

export async function updateKennel(
  _prevState: UpdateKennelState,
  formData: FormData
): Promise<UpdateKennelState> {
  const kennelId = String(formData.get("kennel_id") ?? "");
  if (!kennelId) {
    return { error: "Missing kennel id." };
  }
  const { isAdmin } = await requireKennelAccess(kennelId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Name is required." };
  }

  const validPlatforms = SOCIAL_PLATFORMS.map((p) => p.value);
  const platforms = formData.getAll("social_platform").map(String);
  const values = formData.getAll("social_value").map(String);
  const labels = formData.getAll("social_label").map(String);
  const socialLinks: SocialLink[] = platforms
    .map((platform, i) => {
      const label = labels[i]?.trim();
      return {
        platform,
        value: values[i]?.trim() ?? "",
        ...(platform === "custom" && label ? { label } : {}),
      };
    })
    .filter(
      (link): link is SocialLink =>
        link.value !== "" &&
        validPlatforms.includes(link.platform as SocialLink["platform"])
    );

  const updates: Record<string, unknown> = {
    name,
    description: optionalField(formData, "description"),
    country: optionalField(formData, "country"),
    city: optionalField(formData, "city"),
    phone: optionalField(formData, "phone"),
    email: optionalField(formData, "email"),
    logo_url: optionalField(formData, "logo_url"),
    cover_photo_url: optionalField(formData, "cover_photo_url"),
    social_links: socialLinks,
  };

  const coverPosition = Number(formData.get("cover_photo_position"));
  if (Number.isFinite(coverPosition)) {
    updates.cover_photo_position = Math.min(100, Math.max(0, Math.round(coverPosition)));
  }

  const accentColor = String(formData.get("accent_color") ?? "").trim();
  if (accentColor) {
    if (!/^#[0-9a-f]{6}$/i.test(accentColor)) {
      return { error: "Invalid accent color." };
    }
    updates.accent_color = accentColor;
  }

  // El campo "plan" y "slug" solo existen en el formulario cuando lo
  // renderiza un admin (ver KennelInfoForm), pero por si alguien los
  // agregara a mano al HTML, igual los ignoramos aqui a menos que
  // quien llama realmente sea admin — el slug en particular es la URL
  // publica del kennel, y cambiarla rompe cualquier link que el dueño
  // ya haya compartido, asi que el cliente nunca debe poder tocarla.
  if (isAdmin) {
    const plan = String(formData.get("plan") ?? "").trim();
    if (plan) {
      if (!KENNEL_PLANS.includes(plan as KennelPlan)) {
        return { error: "Invalid plan." };
      }
      updates.plan = plan;
    }

    const slug = String(formData.get("slug") ?? "").trim();
    if (slug) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        return {
          error: "Slug can only contain lowercase letters, numbers, and hyphens.",
        };
      }
      updates.slug = slug;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("kennels")
    .update(updates)
    .eq("id", kennelId);

  if (error) {
    if (error.code === "23505") {
      return { error: "That slug is already taken by another kennel." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${kennelId}`);
  revalidatePath("/[slug]", "page");
  return { error: null, success: true };
}

export interface DogFormState {
  error: string | null;
  success?: boolean;
}

function parseDogForm(
  formData: FormData
): { error: string } | { data: Record<string, unknown> } {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");

  if (!DOG_CATEGORIES.includes(category as DogCategory)) {
    return { error: "Invalid category." };
  }

  // MultiImageUploadField manda una fila <input type="hidden" name="photos">
  // por cada foto subida, por eso usamos getAll en vez de get.
  const photos = formData
    .getAll("photos")
    .map((value) => String(value).trim())
    .filter(Boolean);

  // El resto de los campos (nombre, descripcion, etc.) son opcionales
  // a proposito, pero la foto no: sin ella la tarjeta se publica vacia
  // en la landing publica, y eso ya paso varias veces por descuido.
  if (photos.length === 0) {
    return { error: "Add at least one photo." };
  }

  return {
    data: {
      name,
      category,
      breed: optionalField(formData, "breed"),
      color: optionalField(formData, "color"),
      age: optionalField(formData, "age"),
      price: optionalField(formData, "price"),
      description: optionalField(formData, "description"),
      pedigree_url: optionalField(formData, "pedigree_url"),
      photos,
    },
  };
}

export async function createDog(
  _prevState: DogFormState,
  formData: FormData
): Promise<DogFormState> {
  const kennelId = String(formData.get("kennel_id") ?? "");
  if (!kennelId) {
    return { error: "Missing kennel id." };
  }
  const { isAdmin } = await requireKennelAccess(kennelId);

  const parsed = parseDogForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  // Un admin gestionando el kennel de alguien mas (desde
  // /admin/kennels/[id]) nunca esta sujeto al limite del plan — solo
  // el dueño del kennel lo esta.
  if (!isAdmin) {
    const { data: kennelRow } = await supabase
      .from("kennels")
      .select("plan")
      .eq("id", kennelId)
      .maybeSingle();
    if (kennelRow && isFreePlan(kennelRow.plan)) {
      const limitError = await checkFreePlanDogLimit(
        supabase,
        kennelId,
        parsed.data.category as DogCategory
      );
      if (limitError) {
        return { error: limitError };
      }
    } else if (kennelRow && isFrozenPlan(kennelRow.plan)) {
      return { error: FROZEN_PLAN_MESSAGE };
    }
  }

  const { error } = await supabase
    .from("dogs")
    .insert({ ...parsed.data, kennel_id: kennelId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${kennelId}`);
  revalidatePath("/[slug]", "page");
  return { error: null, success: true };
}

export async function updateDog(
  _prevState: DogFormState,
  formData: FormData
): Promise<DogFormState> {
  const dogId = String(formData.get("dog_id") ?? "");
  if (!dogId) {
    return { error: "Missing dog id." };
  }

  // El kennel_id (y la categoria actual) del perro se leen de la base
  // de datos, no del formulario: asi evitamos depender de campos que
  // el navegador podria manipular.
  const supabase = await createClient();
  const { data: existingDog } = await supabase
    .from("dogs")
    .select("kennel_id, category")
    .eq("id", dogId)
    .maybeSingle();

  if (!existingDog) {
    return { error: "Dog not found." };
  }

  const { isAdmin } = await requireKennelAccess(existingDog.kennel_id);

  const parsed = parseDogForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const newCategory = parsed.data.category as DogCategory;

  // El limite del plan free solo importa si la categoria en verdad
  // esta cambiando — editar otros campos de un perro que ya excede
  // el limite (por ejemplo, un kennel que bajo de PRO a free con mas
  // perros de los que el plan permite) siempre debe poder seguir
  // editandolo, solo no puede mover perros HACIA una categoria llena.
  if (!isAdmin && newCategory !== existingDog.category) {
    const { data: kennelRow } = await supabase
      .from("kennels")
      .select("plan")
      .eq("id", existingDog.kennel_id)
      .maybeSingle();
    if (kennelRow && isFreePlan(kennelRow.plan)) {
      const limitError = await checkFreePlanDogLimit(
        supabase,
        existingDog.kennel_id,
        newCategory,
        dogId
      );
      if (limitError) {
        return { error: limitError };
      }
    }
  }

  const { error } = await supabase
    .from("dogs")
    .update(parsed.data)
    .eq("id", dogId)
    .eq("kennel_id", existingDog.kennel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${existingDog.kennel_id}`);
  revalidatePath("/[slug]", "page");
  return { error: null, success: true };
}

export async function deleteDog(formData: FormData) {
  const dogId = String(formData.get("dog_id") ?? "");
  if (!dogId) return;

  const supabase = await createClient();
  const { data: existingDog } = await supabase
    .from("dogs")
    .select("kennel_id")
    .eq("id", dogId)
    .maybeSingle();

  if (!existingDog) return;

  await requireKennelAccess(existingDog.kennel_id);

  await supabase
    .from("dogs")
    .delete()
    .eq("id", dogId)
    .eq("kennel_id", existingDog.kennel_id);

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${existingDog.kennel_id}`);
  revalidatePath("/[slug]", "page");
}

export interface BreedingFormState {
  error: string | null;
  success?: boolean;
}

function parseBreedingForm(
  formData: FormData
): { error: string } | { data: Record<string, unknown> } {
  const photos = formData
    .getAll("photos")
    .map((value) => String(value).trim())
    .filter(Boolean);

  // El resto de los campos son opcionales a proposito, pero la foto no:
  // sin ella la tarjeta se publica vacia en la landing publica.
  if (photos.length === 0) {
    return { error: "Add at least one photo." };
  }

  return {
    data: {
      title: optionalField(formData, "title"),
      sire_name: optionalField(formData, "sire_name"),
      dam_name: optionalField(formData, "dam_name"),
      date: optionalField(formData, "date"),
      description: optionalField(formData, "description"),
      photos,
    },
  };
}

export async function createBreeding(
  _prevState: BreedingFormState,
  formData: FormData
): Promise<BreedingFormState> {
  const kennelId = String(formData.get("kennel_id") ?? "");
  if (!kennelId) {
    return { error: "Missing kennel id." };
  }
  const { isAdmin } = await requireKennelAccess(kennelId);

  const parsed = parseBreedingForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  // Breedings es una seccion 100% PRO en el plan free — no hay
  // "hasta 2", es 0 hasta que se actualice el plan. Un kennel que
  // baja de PRO a free conserva las que ya tenia (nunca se borran),
  // solo no puede crear mas mientras siga en free.
  if (!isAdmin) {
    const { data: kennelRow } = await supabase
      .from("kennels")
      .select("plan")
      .eq("id", kennelId)
      .maybeSingle();
    if (kennelRow && isFreePlan(kennelRow.plan)) {
      return { error: FREE_PLAN_BREEDINGS_MESSAGE };
    }
    if (kennelRow && isFrozenPlan(kennelRow.plan)) {
      return { error: FROZEN_PLAN_MESSAGE };
    }
  }

  const { error } = await supabase
    .from("breedings")
    .insert({ ...parsed.data, kennel_id: kennelId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${kennelId}`);
  revalidatePath("/[slug]", "page");
  return { error: null, success: true };
}

export async function updateBreeding(
  _prevState: BreedingFormState,
  formData: FormData
): Promise<BreedingFormState> {
  const breedingId = String(formData.get("breeding_id") ?? "");
  if (!breedingId) {
    return { error: "Missing breeding id." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("breedings")
    .select("kennel_id")
    .eq("id", breedingId)
    .maybeSingle();

  if (!existing) {
    return { error: "Breeding not found." };
  }

  await requireKennelAccess(existing.kennel_id);

  const parsed = parseBreedingForm(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { error } = await supabase
    .from("breedings")
    .update(parsed.data)
    .eq("id", breedingId)
    .eq("kennel_id", existing.kennel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${existing.kennel_id}`);
  revalidatePath("/[slug]", "page");
  return { error: null, success: true };
}

export async function deleteBreeding(formData: FormData) {
  const breedingId = String(formData.get("breeding_id") ?? "");
  if (!breedingId) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("breedings")
    .select("kennel_id")
    .eq("id", breedingId)
    .maybeSingle();

  if (!existing) return;

  await requireKennelAccess(existing.kennel_id);

  await supabase
    .from("breedings")
    .delete()
    .eq("id", breedingId)
    .eq("kennel_id", existing.kennel_id);

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${existing.kennel_id}`);
  revalidatePath("/[slug]", "page");
}

// Estas dos se llaman directo desde el cliente (no vienen de un
// <form>), justo despues de soltar el drag en la lista de una
// seccion — por eso re-verifican acceso igual que las demas.
export async function reorderDogs(kennelId: string, orderedIds: string[]) {
  await requireKennelAccess(kennelId);

  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("dogs")
        .update({ display_order: index })
        .eq("id", id)
        .eq("kennel_id", kennelId)
    )
  );

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${kennelId}`);
  revalidatePath("/[slug]", "page");
}

export interface ChangePasswordState {
  error: string | null;
}

// Self-servicio para el dueño del kennel: cambia su propia contraseña
// usando su sesion actual (createClient de @/lib/supabase/server ya
// trae la cookie de auth). No requiere la service-role key, a
// diferencia de crear usuarios nuevos desde /admin.
export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  // Cambiar la contraseña invalida la sesion actual (Supabase la rota
  // por seguridad), asi que en vez de dejar que eso se sienta como un
  // cierre de sesion sorpresivo, lo hacemos explicito: cerramos sesion
  // y mandamos al login con un mensaje claro.
  await supabase.auth.signOut();
  redirect("/login?passwordChanged=1");
}

export async function reorderBreedings(kennelId: string, orderedIds: string[]) {
  await requireKennelAccess(kennelId);

  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("breedings")
        .update({ display_order: index })
        .eq("id", id)
        .eq("kennel_id", kennelId)
    )
  );

  revalidatePath("/dashboard");
  revalidatePath(`/admin/kennels/${kennelId}`);
  revalidatePath("/[slug]", "page");
}
