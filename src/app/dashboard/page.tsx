import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getKennelMembership } from "@/lib/supabase/auth";
import { signOut } from "@/lib/supabase/actions";
import { getPublicOrigin } from "@/lib/get-public-origin";
import DashboardApp from "@/components/kennel-editor/DashboardApp";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getKennelMembership(user.id);

  if (!membership) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-paper p-8 text-center text-onlight dark:bg-ink dark:text-ink-text">
        <h1 className="font-display text-xl">Access denied</h1>
        <p className="text-onlight-dim dark:text-ink-text-dim">
          Your account ({user.email}) isn&apos;t linked to any kennel.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: kennel }, { data: dogs }, { data: breedings }] =
    await Promise.all([
      supabase
        .from("kennels")
        .select("*")
        .eq("id", membership.kennel_id)
        .maybeSingle(),
      supabase
        .from("dogs")
        .select("*")
        .eq("kennel_id", membership.kennel_id)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("breedings")
        .select("*")
        .eq("kennel_id", membership.kennel_id)
        .order("display_order", { ascending: true })
        .order("date", { ascending: false }),
    ]);

  if (!kennel) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-paper p-8 text-center text-onlight dark:bg-ink dark:text-ink-text">
        <h1 className="font-display text-xl">Kennel not found</h1>
      </main>
    );
  }

  const origin = await getPublicOrigin();

  return (
    <DashboardApp
      kennel={kennel}
      dogs={dogs ?? []}
      breedings={breedings ?? []}
      onSignOut={signOut}
      publicUrl={`${origin}/${kennel.slug}`}
    />
  );
}
