import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "./supabase/admin";

export type CurrentParticipant = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
};

export async function getCurrentParticipant() {
  const cookieStore = await cookies();
  const participantId = cookieStore.get("participant_id")?.value;

  if (!participantId) {
    return null;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", participantId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CurrentParticipant;
}

export async function requireParticipant() {
  const participant = await getCurrentParticipant();

  if (!participant) {
    redirect("/login");
  }

  return participant;
}

export async function requireAdminParticipant() {
  const participant = await requireParticipant();

  if (!participant.is_admin) {
    redirect("/dashboard");
  }

  return participant;
}
