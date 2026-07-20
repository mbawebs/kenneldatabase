"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, getKennelMembership } from "@/lib/supabase/auth";
import { getStripeClient } from "@/lib/stripe/client";
import { getPublicOrigin } from "@/lib/get-public-origin";

// Solo se llama desde el boton "Upgrade to PRO" del dashboard, que ya
// solo aparece cuando el visitante es el dueño real del kennel (nunca
// un admin gestionando el de alguien mas) — pero igual se re-verifica
// aqui, porque un Server Action es un endpoint POST alcanzable
// directamente, no solo un boton en una pantalla protegida.
export async function createProCheckoutSession(formData: FormData) {
  const kennelId = String(formData.get("kennel_id") ?? "");
  if (!kennelId) {
    redirect("/dashboard");
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
    throw new Error("Missing STRIPE_PRO_PRICE_ID in .env.local.");
  }

  const stripe = getStripeClient();
  const origin = await getPublicOrigin();

  // kennel_id va tanto en client_reference_id como en el metadata de
  // la sesion Y de la suscripcion resultante (subscription_data.metadata):
  // el webhook necesita encontrarlo distinto segun el evento —
  // checkout.session.completed trae la sesion, pero
  // customer.subscription.deleted (la cancelacion) solo trae la
  // suscripcion, no la sesion original.
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
    throw new Error("Stripe didn't return a checkout URL.");
  }

  redirect(session.url);
}
