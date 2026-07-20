import type { DogCategory, KennelPlan } from "@/lib/supabase/types";

// Solo 'free' (el plan del registro publico en /signup) tiene
// limites. Los planes legados ('demo'/'dashboard'/'multipage', dados
// de alta a mano desde /admin antes de este modelo freemium) y 'pro'
// no tienen tope — evita romper retroactivamente los kennels ya
// existentes que nunca pasaron por /signup.
export function isFreePlan(plan: KennelPlan): boolean {
  return plan === "free";
}

export const FREE_PLAN_DOG_LIMIT = 2;

// 'production' y 'puppy' cuentan juntos contra el mismo tope (asi
// esta agrupada la seccion "Productions" en el dashboard: DOG_SECTIONS
// en DashboardApp.tsx).
export function categoryGroupCategories(category: DogCategory): DogCategory[] {
  if (category === "production" || category === "puppy") {
    return ["production", "puppy"];
  }
  return [category];
}

export const FREE_PLAN_AVAILABLE_MESSAGE =
  "Available listings are a PRO feature. Upgrade to PRO to unlock this section.";
export const FREE_PLAN_BREEDINGS_MESSAGE =
  "Breedings are a PRO feature. Upgrade to PRO to unlock this section.";

export function freePlanDogLimitMessage(): string {
  return `Free plan allows up to ${FREE_PLAN_DOG_LIMIT} dogs in this section. Upgrade to PRO for unlimited.`;
}

// Se usa en KennelLandingView (landing publica + preview del
// dashboard, mismo componente para ambas) para que un kennel que bajo
// de PRO a free no siga mostrando publicamente todos los perros que
// subio mientras pagaba — solo se ven los primeros FREE_PLAN_DOG_LIMIT
// de cada seccion (segun el orden que el dueño ya eligio arrastrando
// en el dashboard), nunca "available", nunca breedings. Esto es
// puramente de exhibicion: en el dashboard el dueño sigue viendo y
// pudiendo reordenar/editar/borrar todos sus perros, sin importar
// cuantos sean — este filtro solo decide que aparece en la pagina
// que ve el publico.
export function filterDogsForFreePlan<T extends { category: DogCategory }>(
  dogs: T[]
): T[] {
  const countByGroup = new Map<string, number>();
  const result: T[] = [];
  for (const dog of dogs) {
    if (dog.category === "available") continue;
    const groupKey = categoryGroupCategories(dog.category).join("+");
    const count = countByGroup.get(groupKey) ?? 0;
    if (count >= FREE_PLAN_DOG_LIMIT) continue;
    countByGroup.set(groupKey, count + 1);
    result.push(dog);
  }
  return result;
}
