"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, getKennelMembership } from "@/lib/supabase/auth";
import { getStripeClient } from "@/lib/stripe/client";
import { getPublicOrigin } from "@/lib/get-public-origin";

export interface CreateCheckoutState {
  error: string | null;
}

// Solo se llama desde el boton "Upgrade to PRO" del dashboard, que ya
// solo aparece cuando el visitante es el dueño real del kennel (nunca
// un admin gestionando el de alguien mas) — pero igual se re-verifica
// aqui, porque un Server Action es un endpoint POST alcanzable
// directamente, no solo un boton en una pantalla protegida.
//
// A diferencia de la version anterior (sin useActionState), cualquier
// falla de Stripe (env var faltante, price id invalido, lo que sea)
// regresa como state.error visible en pantalla, en vez de tronar
// hacia la pagina generica de error de Next.js — esa pagina no deja
// ver el mensaje real en produccion, asi que un error de configuracion
// se volvia indiagnosticable sin acceso a los logs de Vercel.
export async function createProCheckoutSession(
  _prevState: CreateCheckoutState,
  formData: FormData
): Promise<CreateCheckoutState> {
  const kennelId = String(formData.get("kennel_id") ?? "");
  if (!kennelId) {
    return { error: "Missing kennel id." };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const membership = await getKennelMembership(user.id);
  if (!membership || membership.kennel_id !== kennelId) {
    redirect("/login");
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return {
      error: "Stripe isn't configured yet (missing STRIPE_PRO_PRICE_ID). Contact the administrator.",
    };
  }

  let sessionUrl: string;
  try {
    const stripe = getStripeClient();
    const origin = await getPublicOrigin();

    // kennel_id va tanto en client_reference_id como en el metadata
    // de la sesion Y de la suscripcion resultante
    // (subscription_data.metadata): el webhook necesita encontrarlo
    // distinto segun el evento — checkout.session.completed trae la
    // sesion, pero customer.subscription.deleted (la cancelacion)
    // solo trae la suscripcion, no la sesion original.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/dashboard`,
      client_reference_id: kennelId,
      customer_email: user.email,
      metadata: { kennel_id: kennelId },
      subscription_data: {
        metadata: { kennel_id: kennelId },
      },
    });

    if (!session.url) {
      return { error: "Stripe didn't return a checkout URL. Try again." };
    }
    sessionUrl = session.url;
  } catch (err) {
    return { error: `Couldn't start checkout: ${(err as Error).message}` };
  }

  // Fuera del try/catch a proposito: redirect() de Next.js funciona
  // lanzando un error especial que el framework atrapa mas arriba —
  // si estuviera dentro del try, este mismo catch lo atraparia primero
  // y rompería la redireccion.
  redirect(sessionUrl);
}
