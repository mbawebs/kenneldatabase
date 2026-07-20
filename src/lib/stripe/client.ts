import "server-only";
import Stripe from "stripe";

// Mismo patron que createServiceRoleClient: se construye uno nuevo
// por llamada (barato) en vez de un singleton — asi no hay que
// pensar en inicializacion en frio ni en variables de entorno que
// cambian entre builds.
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY in .env.local (Stripe Dashboard > Developers > API keys)."
    );
  }
  return new Stripe(secretKey);
}
