import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const [{ data: dogs }, { data: breedings }] = await Promise.all([
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
      .order("date", { ascending: false }),
  ]);

  return (
    <KennelLandingView
      kennel={kennel}
      dogs={dogs ?? []}
      breedings={breedings ?? []}
    />
  );
}
