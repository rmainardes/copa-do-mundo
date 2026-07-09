import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "../../../../lib/supabase/admin";

type SelectParticipantPayload = {
  participant_id?: string;
};

export async function POST(request: Request) {
  let payload: SelectParticipantPayload;

  try {
    payload = (await request.json()) as SelectParticipantPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (!payload.participant_id) {
    return NextResponse.json(
      { error: "Participante não informado." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: participant, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", payload.participant_id)
    .single();

  if (error || !participant) {
    return NextResponse.json(
      { error: "Participante não encontrado." },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();

  cookieStore.set("participant_id", payload.participant_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({
    ok: true,
  });
}
