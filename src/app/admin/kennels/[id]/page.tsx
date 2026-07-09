import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import DashboardApp from "@/components/kennel-editor/DashboardApp";

export default async function AdminKennelManagePage({
  params,
}: PageProps<"/admin/kennels/[id]">) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Igual que /admin: solo super-admins pueden entrar aquí. Un editor
  // autenticado que intente abrir esta URL directamente (aunque sea la
  // de su propio kennel) recibe este mismo mensaje, no el contenido.
  if (!(await isAdmin(user.id))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-paper p-8 text-center text-onlight dark:bg-ink dark:text-ink-text">
        <h1 className="font-display text-xl">Access denied</h1>
        <p className="text-onlight-dim dark:text-ink-text-dim">
          Your account ({user.email}) doesn&apos;t have administrator
          permissions.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: kennel }, { data: dogs }, { data: breedings }] =
    await Promise.all([
      supabase.from("kennels").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("dogs")
        .select("*")
        .eq("kennel_id", id)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("breedings")
        .select("*")
        .eq("kennel_id", id)
        .order("date", { ascending: false }),
    ]);

  if (!kennel) {
    notFound();
  }

  return (
    <DashboardApp
      kennel={kennel}
      dogs={dogs ?? []}
      breedings={breedings ?? []}
      isAdmin
      backLink={{ href: "/admin", label: "Back to admin panel" }}
    />
  );
}
