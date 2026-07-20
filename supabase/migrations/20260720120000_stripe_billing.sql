-- Fase 3: suscripcion PRO via Stripe Checkout + webhook.
--
-- stripe_customer_id / stripe_subscription_id: se llenan solos desde
-- el webhook (POST /api/stripe/webhook) cuando se completa un
-- checkout. Se guardan para poder ubicar el kennel correcto cuando
-- llegue el evento de cancelacion (customer.subscription.deleted),
-- que trae el id de la suscripcion pero no siempre el metadata que
-- ya le pusimos (se usa como respaldo si el metadata faltara).
alter table public.kennels
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Amplia el trigger de la Fase 1 (antes solo protegia plan/owner_id)
-- para que tampoco un usuario normal pueda escribirse el/los id de
-- Stripe directo por API — un valor manipulado ahi no le daria plan
-- 'pro' (esa columna ya esta protegida aparte), pero si podria
-- confundir al sistema de facturacion o, mas adelante, dejarlo ver
-- el portal de facturacion de otro kennel.
create or replace function public.protect_kennel_plan_and_owner()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.plan is distinct from old.plan and not public.is_admin() then
    raise exception 'Only an admin or the billing system can change a kennel''s plan.';
  end if;

  if new.owner_id is distinct from old.owner_id and not public.is_admin() then
    raise exception 'owner_id cannot be changed directly.';
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id and not public.is_admin() then
    raise exception 'stripe_customer_id cannot be changed directly.';
  end if;

  if new.stripe_subscription_id is distinct from old.stripe_subscription_id and not public.is_admin() then
    raise exception 'stripe_subscription_id cannot be changed directly.';
  end if;

  return new;
end;
$$;
