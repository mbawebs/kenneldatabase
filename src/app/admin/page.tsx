import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import { signOut } from "@/lib/supabase/actions";
import CreateKennelForm from "./CreateKennelForm";
import CreateUserForm from "./CreateUserForm";
import KennelsTable from "./KennelsTable";
import OwnersTable, { type OwnerRow } from "./OwnersTable";
import SiteSettingsForm from "./SiteSettingsForm";
import type { Kennel, SiteSettings } from "@/lib/supabase/types";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

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
  // Se ordena por created_at desc directo en la query — es el orden
  // que usa "Recently added" (el default en KennelsTable/OwnersTable).
  // Busqueda/orden/paginado de estas listas viven del lado del
  // cliente (ver KennelsTable.tsx / OwnersTable.tsx) para que
  // respondan al instante mientras se escribe, sin ida y vuelta al
  // servidor.
  const { data: kennelRows } = await supabase
    .from("kennels")
    .select("*")
    .order("created_at", { ascending: false });
  const kennels: Kennel[] = kennelRows ?? [];

  const { data: kennelUserRows } = await supabase
    .from("kennel_users")
    .select("id, user_id, role, kennels(name, slug)")
    .order("created_at", { ascending: false });

  // Los correos viven en Supabase Auth, no en una tabla publica, asi
  // que hace falta el cliente de service-role para leerlos (la key
  // anon no tiene permiso). listUsers() trae hasta 50 por default —
  // de sobra para el numero de dueños que maneja este directorio hoy.
  const serviceRole = createServiceRoleClient();
  const { data: authUsers } = await serviceRole.auth.admin.listUsers();
  const emailByUserId = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? "(no email)"])
  );

  const owners: OwnerRow[] = (kennelUserRows ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    role: row.role,
    email: emailByUserId.get(row.user_id) ?? "(unknown)",
    kennelName: row.kennels?.[0]?.name ?? "—",
  }));

  const { data: siteSettingsRow } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();
  const siteSettings: SiteSettings = siteSettingsRow ?? {
    hero_image_url: null,
    top_banner_text: null,
    top_banner_link: null,
    banner_left_image_url: null,
    banner_left_link: null,
    banner_right_image_url: null,
    banner_right_link: null,
    mobile_banner_top_image_url: null,
    mobile_banner_top_link: null,
    mobile_banner_bottom_image_url: null,
    mobile_banner_bottom_link: null,
  };

  return (
    <main className="min-h-screen bg-paper text-onlight dark:bg-ink dark:text-ink-text">
      <div className="mx-auto max-w-5xl space-y-12 p-4 py-8">
        <div className="flex items-start justify-between gap-4 border-b border-saddle/20 pb-6 dark:border-brass/20">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-saddle dark:text-brass">
              Super-admin
            </p>
            <h1 className="mt-1 font-display text-2xl">Admin panel</h1>
            <p className="mt-1 text-sm text-onlight-dim dark:text-ink-text-dim">
              {user.email}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="border border-saddle/30 px-3 py-1.5 font-mono text-xs uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
            >
              Log out
            </button>
          </form>
        </div>

        <section>
          <KennelsTable kennels={kennels} />
        </section>

        <section>
          <OwnersTable owners={owners} />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Create new kennel</h2>
          <CreateKennelForm />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Add a user</h2>
          <CreateUserForm kennels={kennels} />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Homepage</h2>
          <SiteSettingsForm settings={siteSettings} />
        </section>
      </div>
    </main>
  );
}
