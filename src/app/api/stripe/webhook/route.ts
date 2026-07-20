import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// Stripe llama esta ruta directo (sin sesion, sin cookies) — la unica
// prueba de que el request es legitimo es la firma en el header
// "stripe-signature", verificada contra STRIPE_WEBHOOK_SECRET. Por
// eso esta ruta necesita el body CRUDO sin parsear (request.text()),
// no JSON ya parseado: la firma se calcula sobre los bytes exactos
// que Stripe mando.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // service-role: esta es precisamente la "billing system" que el
  // trigger protect_kennel_plan_and_owner (Fase 1) deja pasar sin
  // pedir is_admin() — bypasea RLS a proposito, es el unico llamador
  // legitimo fuera de /admin que puede mover kennels.plan.
  const serviceRole = createServiceRoleClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const kennelId = session.metadata?.kennel_id ?? session.client_reference_id;

    if (kennelId) {
      await serviceRole
        .from("kennels")
        .update({
          plan: "pro",
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : (session.customer?.id ?? null),
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription?.id ?? null),
        })
        .eq("id", kennelId);
    }
  }

  // Se dispara cuando la suscripcion termina de verdad (cancelacion
  // inmediata, o el fin del periodo tras un cancel_at_period_end) —
  // no en customer.subscription.updated, que tambien dispara por
  // cambios que no deben tocar el plan (ej. metodo de pago). No se
  // borran los perros de mas, solo se bloquea agregar nuevos hasta
  // que vuelva a pagar (ver checkFreePlanDogLimit en actions.ts).
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const kennelId = subscription.metadata?.kennel_id;

    if (kennelId) {
      await serviceRole.from("kennels").update({ plan: "free" }).eq("id", kennelId);
    } else {
      // Respaldo por si el metadata no llegara: buscar por el id de
      // suscripcion que ya habiamos guardado en checkout.session.completed.
      await serviceRole
        .from("kennels")
        .update({ plan: "free" })
        .eq("stripe_subscription_id", subscription.id);
    }
  }

  return NextResponse.json({ received: true });
}
