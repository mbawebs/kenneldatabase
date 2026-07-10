import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentUser, isAdmin } from "@/lib/supabase/auth";
import { signOut } from "@/lib/supabase/actions";
import { toggleKennelStatus } from "./actions";
import CreateKennelForm from "./CreateKennelForm";
import CreateUserForm from "./CreateUserForm";
import ResetPasswordControl from "./ResetPasswordControl";
import SiteSettingsForm from "./SiteSettingsForm";
import type { SiteSettings } from "@/lib/supabase/types";

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
  const { data: kennels } = await supabase
    .from("kennels")
    .select("*")
    .order("created_at", { ascending: false });

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
          <h2 className="mb-4 font-display text-lg">
            Kennels ({kennels?.length ?? 0})
          </h2>
          <div className="overflow-x-auto border border-saddle/20 dark:border-brass/20">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-saddle/20 bg-parchment font-mono text-[0.68rem] uppercase tracking-[0.1em] text-onlight-dim dark:border-brass/20 dark:bg-ink-2 dark:text-ink-text-dim">
                <tr>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Slug</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {(kennels ?? []).map((kennel) => (
                  <tr
                    key={kennel.id}
                    className="border-t border-saddle/10 dark:border-brass/10"
                  >
                    <td className="p-3 font-medium">{kennel.name}</td>
                    <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                      /{kennel.slug}
                    </td>
                    <td className="p-3">
                      <span
                        className={`border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide ${
                          kennel.status === "active"
                            ? "border-hunter/40 text-hunter dark:border-hunter-2 dark:text-hunter-2"
                            : "border-onlight-dim/30 text-onlight-dim dark:border-ink-text-dim/30 dark:text-ink-text-dim"
                        }`}
                      >
                        {kennel.status}
                      </span>
                    </td>
                    <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                      {kennel.plan}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/kennels/${kennel.id}`}
                          className="border border-saddle/30 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
                        >
                          Manage
                        </Link>
                        <form action={toggleKennelStatus}>
                          <input type="hidden" name="id" value={kennel.id} />
                          <input
                            type="hidden"
                            name="nextStatus"
                            value={
                              kennel.status === "active"
                                ? "inactive"
                                : "active"
                            }
                          />
                          <button
                            type="submit"
                            className="border border-saddle/30 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
                          >
                            {kennel.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {(kennels ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-3 text-center text-onlight-dim dark:text-ink-text-dim"
                    >
                      No kennels yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">
            Kennel owners ({kennelUserRows?.length ?? 0})
          </h2>
          <div className="overflow-x-auto border border-saddle/20 dark:border-brass/20">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-saddle/20 bg-parchment font-mono text-[0.68rem] uppercase tracking-[0.1em] text-onlight-dim dark:border-brass/20 dark:bg-ink-2 dark:text-ink-text-dim">
                <tr>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Kennel</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {(kennelUserRows ?? []).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-saddle/10 dark:border-brass/10"
                  >
                    <td className="p-3 font-medium">
                      {emailByUserId.get(row.user_id) ?? "(unknown)"}
                    </td>
                    <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                      {row.kennels?.[0]?.name ?? "—"}
                    </td>
                    <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                      {row.role}
                    </td>
                    <td className="p-3 text-right">
                      <ResetPasswordControl userId={row.user_id} />
                    </td>
                  </tr>
                ))}
                {(kennelUserRows ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-3 text-center text-onlight-dim dark:text-ink-text-dim"
                    >
                      No kennel owners yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Create new kennel</h2>
          <CreateKennelForm />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Add a user</h2>
          <CreateUserForm kennels={kennels ?? []} />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Homepage</h2>
          <SiteSettingsForm settings={siteSettings} />
        </section>
      </div>
    </main>
  );
}
