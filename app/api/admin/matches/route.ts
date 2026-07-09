import { NextResponse } from "next/server";
import { getCurrentParticipant } from "../../../../lib/current-participant";
import { createAdminClient } from "../../../../lib/supabase/admin";

type UpdateMatchResultPayload = {
  match_id?: string;
  status?: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  home_score?: number | null;
  away_score?: number | null;
};

function isValidScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function isValidStatus(
  value: unknown,
): value is UpdateMatchResultPayload["status"] {
  return (
    value === "scheduled" ||
    value === "live" ||
    value === "finished" ||
    value === "postponed" ||
    value === "cancelled"
  );
}

export async function PATCH(request: Request) {
  const participant = await getCurrentParticipant();

  if (!participant) {
    return NextResponse.json(
      { error: "Participante não selecionado." },
      { status: 401 },
    );
  }

  if (!participant.is_admin) {
    return NextResponse.json(
      { error: "Apenas administradores podem executar esta ação." },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();

  let payload: UpdateMatchResultPayload;

  try {
    payload = (await request.json()) as UpdateMatchResultPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (!payload.match_id) {
    return NextResponse.json({ error: "Jogo não informado." }, { status: 400 });
  }

  if (!isValidStatus(payload.status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const homeScore = payload.home_score;
  const awayScore = payload.away_score;

  if (payload.status === "finished") {
    if (!isValidScore(homeScore)) {
      return NextResponse.json(
        { error: "Placar do mandante inválido." },
        { status: 400 },
      );
    }

    if (!isValidScore(awayScore)) {
      return NextResponse.json(
        { error: "Placar do visitante inválido." },
        { status: 400 },
      );
    }
  }

  if (
    payload.status !== "finished" &&
    homeScore !== null &&
    homeScore !== undefined &&
    !isValidScore(homeScore)
  ) {
    return NextResponse.json(
      { error: "Placar do mandante inválido." },
      { status: 400 },
    );
  }

  if (
    payload.status !== "finished" &&
    awayScore !== null &&
    awayScore !== undefined &&
    !isValidScore(awayScore)
  ) {
    return NextResponse.json(
      { error: "Placar do visitante inválido." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      status: payload.status,
      home_score: homeScore ?? null,
      away_score: awayScore ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.match_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
  });
}
