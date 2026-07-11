import { cache } from "react";
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getCurrentUser, getKennelMembership, isAdmin } from "@/lib/supabase/auth";
import KennelLandingView from "@/components/kennel-landing/KennelLandingView";

// cache() evita que generateMetadata y la página vuelvan a consultar
// Supabase por separado: ambas comparten el mismo resultado dentro de
// la misma petición.
const getKennelBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kennels")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data;
});

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const kennel = await getKennelBySlug(slug);

  if (!kennel) {
    return { title: "Kennel not found" };
  }

  return {
    title: kennel.name,
    description: kennel.description ?? undefined,
  };
}

export default async function KennelPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const kennel = await getKennelBySlug(slug);

  if (!kennel) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: dogs }, { data: breedings }, viewerIsOwnerOrAdmin] =
    await Promise.all([
      supabase
        .from("dogs")
        .select("*")
        .eq("kennel_id", kennel.id)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("breedings")
        .select("*")
        .eq("kennel_id", kennel.id)
        .order("display_order", { ascending: true })
        .order("date", { ascending: false }),
      isOwnerOrAdmin(kennel.id),
    ]);

  // El contador de visitas alimenta el "128 visits" que se ve en las
  // tarjetas del Home — que el propio dueño (o un admin) recargando su
  // pagina lo infle no le sirve a nadie, por eso se excluye. Se suma
  // con after() para no atrasar la respuesta, y por eso el chequeo de
  // dueño/admin (que usa cookies()) se resuelve ANTES de este punto:
  // cookies() no se puede leer dentro del callback de after() en un
  // Server Component.
  if (!viewerIsOwnerOrAdmin) {
    after(async () => {
      const serviceRole = createServiceRoleClient();
      await serviceRole.rpc("increment_kennel_views", {
        target_id: kennel.id,
      });
    });
  }

  return (
    <KennelLandingView
      kennel={kennel}
      dogs={dogs ?? []}
      breedings={breedings ?? []}
    />
  );
}

async function isOwnerOrAdmin(kennelId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (await isAdmin(user.id)) return true;
  const membership = await getKennelMembership(user.id);
  return membership?.kennel_id === kennelId;
}
