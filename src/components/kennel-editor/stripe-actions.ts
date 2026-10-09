"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, getKennelMembership } from "@/lib/supabase/auth";

export interface CreateCheckoutState {
  error: string | null;
}

export async function createProCheckoutSession(
  _prevState: CreateCheckoutState,
  formData: FormData
): Promise<CreateCheckoutState> {
  const kennelId = String(formData.get("kennel_id") ?? "");

  if (!kennelId) {
    return { error: "Missing kennel id." };
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getKennelMembership(user.id);

  if (!membership || membership.kennel_id !== kennelId) {
    redirect("/login");
  }

  redirect(
    `https://kennel-database-migration-preview.mbastudio.chatgpt.site/owner/kennels/${encodeURIComponent(kennelId)}`
  );
}
