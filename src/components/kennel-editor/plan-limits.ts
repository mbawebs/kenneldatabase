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

// TODO Fase 3: reemplazar por el link real de Stripe Checkout para
// la suscripcion PRO. Mientras tanto manda a contacto directo, mismo
// mecanismo que ya usa /list-your-kennel.
export const UPGRADE_TO_PRO_URL = "https://www.instagram.com/marckbarrera_art/";

export const FREE_PLAN_AVAILABLE_MESSAGE =
  "Available listings are a PRO feature. Upgrade to PRO to unlock this section.";
export const FREE_PLAN_BREEDINGS_MESSAGE =
  "Breedings are a PRO feature. Upgrade to PRO to unlock this section.";

export function freePlanDogLimitMessage(): string {
  return `Free plan allows up to ${FREE_PLAN_DOG_LIMIT} dogs in this section. Upgrade to PRO for unlimited.`;
}
