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
import type { Kennel, SiteSettings } from "@/lib/supabase/types";

const PAGE_SIZE = 10;

interface OwnerRow {
  id: string;
  user_id: string;
  role: string;
  email: string;
  kennelName: string;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
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

  const params = await searchParams;
  const kQuery = firstValue(params.kq);
  const kSort = firstValue(params.ksort) || "recent";
  const kPageRequested = Number(firstValue(params.kpage)) || 1;
  const oQuery = firstValue(params.oq);
  const oSort = firstValue(params.osort) || "recent";
  const oPageRequested = Number(firstValue(params.opage)) || 1;

  const supabase = await createClient();
  // Se ordena por created_at desc directo en la query — es el orden
  // que usa "Recently added" (el default), asi que no hace falta
  // reordenar en JS salvo que el usuario pida "Name (A-Z)".
  const { data: allKennelRows } = await supabase
    .from("kennels")
    .select("*")
    .order("created_at", { ascending: false });
  const allKennels: Kennel[] = allKennelRows ?? [];

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

  const allOwnerRows: OwnerRow[] = (kennelUserRows ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    role: row.role,
    email: emailByUserId.get(row.user_id) ?? "(unknown)",
    kennelName: row.kennels?.[0]?.name ?? "—",
  }));

  // Filtrado + orden + paginado, mismo patron que el buscador del
  // home (src/app/page.tsx): filtrar primero, ordenar despues,
  // recortar a PAGE_SIZE al final.
  const filteredKennels = allKennels.filter((k) =>
    kQuery ? k.name.toLowerCase().includes(kQuery.toLowerCase()) : true
  );
  const sortedKennels = [...filteredKennels].sort((a, b) =>
    kSort === "name" ? a.name.localeCompare(b.name) : 0
  );
  const kTotalPages = Math.max(1, Math.ceil(sortedKennels.length / PAGE_SIZE));
  const kPage = Math.min(Math.max(1, kPageRequested), kTotalPages);
  const pageKennels = sortedKennels.slice(
    (kPage - 1) * PAGE_SIZE,
    kPage * PAGE_SIZE
  );

  const filteredOwners = allOwnerRows.filter((o) =>
    oQuery ? o.email.toLowerCase().includes(oQuery.toLowerCase()) : true
  );
  const sortedOwners = [...filteredOwners].sort((a, b) =>
    oSort === "name" ? a.email.localeCompare(b.email) : 0
  );
  const oTotalPages = Math.max(1, Math.ceil(sortedOwners.length / PAGE_SIZE));
  const oPage = Math.min(Math.max(1, oPageRequested), oTotalPages);
  const pageOwners = sortedOwners.slice(
    (oPage - 1) * PAGE_SIZE,
    oPage * PAGE_SIZE
  );

  const currentParams = {
    kq: kQuery,
    ksort: kSort,
    kpage: String(kPage),
    oq: oQuery,
    osort: oSort,
    opage: String(oPage),
  };

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
          <h2 className="mb-4 font-display text-lg">
            Kennels ({sortedKennels.length}
            {kQuery ? ` of ${allKennels.length}` : ""})
          </h2>

          <form
            method="GET"
            className="mb-4 flex flex-wrap items-end gap-3 border-b border-saddle/15 pb-4 dark:border-brass/15"
          >
            <div className="min-w-[200px] flex-1 space-y-1">
              <label
                htmlFor="kq"
                className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
              >
                Search by name
              </label>
              <input
                id="kq"
                name="kq"
                defaultValue={kQuery}
                placeholder="Kennel name…"
                className="w-full rounded border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass"
              />
            </div>
            <div className="min-w-[170px] space-y-1">
              <label
                htmlFor="ksort"
                className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
              >
                Sort by
              </label>
              <select
                id="ksort"
                name="ksort"
                defaultValue={kSort}
                className="w-full rounded border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass"
              >
                <option value="recent">Recently added</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            <input type="hidden" name="oq" value={oQuery} />
            <input type="hidden" name="osort" value={oSort} />
            <input type="hidden" name="opage" value={String(oPage)} />
            <button
              type="submit"
              className="border border-saddle/30 px-4 py-2 font-mono text-xs uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
            >
              Apply
            </button>
            {(kQuery || kSort !== "recent") && (
              <Link
                href={buildAdminHref(currentParams, {
                  kq: undefined,
                  ksort: undefined,
                  kpage: undefined,
                })}
                className="font-mono text-xs uppercase tracking-wide text-onlight-dim underline decoration-onlight-dim/40 underline-offset-2 hover:text-saddle hover:decoration-saddle dark:text-ink-text-dim"
              >
                Clear
              </Link>
            )}
          </form>

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
                {pageKennels.map((kennel) => (
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
                {pageKennels.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-3 text-center text-onlight-dim dark:text-ink-text-dim"
                    >
                      {kQuery ? "No kennels match that search." : "No kennels yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={kPage}
            totalPages={kTotalPages}
            buildHref={(page) =>
              buildAdminHref(currentParams, {
                kpage: page > 1 ? String(page) : undefined,
              })
            }
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">
            Kennel owners ({sortedOwners.length}
            {oQuery ? ` of ${allOwnerRows.length}` : ""})
          </h2>

          <form
            method="GET"
            className="mb-4 flex flex-wrap items-end gap-3 border-b border-saddle/15 pb-4 dark:border-brass/15"
          >
            <div className="min-w-[200px] flex-1 space-y-1">
              <label
                htmlFor="oq"
                className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
              >
                Search by email
              </label>
              <input
                id="oq"
                name="oq"
                defaultValue={oQuery}
                placeholder="owner@example.com"
                className="w-full rounded border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass"
              />
            </div>
            <div className="min-w-[170px] space-y-1">
              <label
                htmlFor="osort"
                className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
              >
                Sort by
              </label>
              <select
                id="osort"
                name="osort"
                defaultValue={oSort}
                className="w-full rounded border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass"
              >
                <option value="recent">Recently added</option>
                <option value="name">Email (A-Z)</option>
              </select>
            </div>
            <input type="hidden" name="kq" value={kQuery} />
            <input type="hidden" name="ksort" value={kSort} />
            <input type="hidden" name="kpage" value={String(kPage)} />
            <button
              type="submit"
              className="border border-saddle/30 px-4 py-2 font-mono text-xs uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
            >
              Apply
            </button>
            {(oQuery || oSort !== "recent") && (
              <Link
                href={buildAdminHref(currentParams, {
                  oq: undefined,
                  osort: undefined,
                  opage: undefined,
                })}
                className="font-mono text-xs uppercase tracking-wide text-onlight-dim underline decoration-onlight-dim/40 underline-offset-2 hover:text-saddle hover:decoration-saddle dark:text-ink-text-dim"
              >
                Clear
              </Link>
            )}
          </form>

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
                {pageOwners.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-saddle/10 dark:border-brass/10"
                  >
                    <td className="p-3 font-medium">{row.email}</td>
                    <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                      {row.kennelName}
                    </td>
                    <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                      {row.role}
                    </td>
                    <td className="p-3 text-right">
                      <ResetPasswordControl userId={row.user_id} />
                    </td>
                  </tr>
                ))}
                {pageOwners.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-3 text-center text-onlight-dim dark:text-ink-text-dim"
                    >
                      {oQuery ? "No owners match that search." : "No kennel owners yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={oPage}
            totalPages={oTotalPages}
            buildHref={(page) =>
              buildAdminHref(currentParams, {
                opage: page > 1 ? String(page) : undefined,
              })
            }
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Create new kennel</h2>
          <CreateKennelForm />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Add a user</h2>
          <CreateUserForm kennels={allKennels} />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Homepage</h2>
          <SiteSettingsForm settings={siteSettings} />
        </section>
      </div>
    </main>
  );
}

function AdminPagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const arrowClass = (disabled: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm transition-colors ${
      disabled
        ? "pointer-events-none text-onlight-dim/30 dark:text-ink-text-dim/20"
        : "text-onlight-dim hover:bg-parchment dark:text-ink-text-dim dark:hover:bg-ink-2"
    }`;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
    >
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-label="Previous page"
        aria-disabled={currentPage === 1}
        className={arrowClass(currentPage === 1)}
      >
        ‹
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold transition-colors ${
            page === currentPage
              ? "bg-saddle text-paper dark:bg-brass dark:text-ink"
              : "text-onlight-dim hover:bg-parchment dark:text-ink-text-dim dark:hover:bg-ink-2"
          }`}
        >
          {page}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-label="Next page"
        aria-disabled={currentPage === totalPages}
        className={arrowClass(currentPage === totalPages)}
      >
        ›
      </Link>
    </nav>
  );
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildAdminHref(
  current: Record<string, string>,
  overrides: Record<string, string | undefined>
) {
  const merged = { ...current, ...overrides };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/admin?${query}` : "/admin";
}
