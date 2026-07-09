import { NextResponse } from "next/server";
import { getCurrentParticipant } from "../../../lib/current-participant";
import { createAdminClient } from "../../../lib/supabase/admin";

type SavePredictionPayload = {
  match_id?: string;
  predicted_home_score?: number;
  predicted_away_score?: number;
};

function isValidScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

export async function POST(request: Request) {
  const participant = await getCurrentParticipant();

  if (!participant) {
    return NextResponse.json(
      { error: "Participante não selecionado." },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();

  let payload: SavePredictionPayload;

  try {
    payload = (await request.json()) as SavePredictionPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (!payload.match_id) {
    return NextResponse.json({ error: "Jogo não informado." }, { status: 400 });
  }

  if (!isValidScore(payload.predicted_home_score)) {
    return NextResponse.json(
      { error: "Placar do mandante inválido." },
      { status: 400 },
    );
  }

  if (!isValidScore(payload.predicted_away_score)) {
    return NextResponse.json(
      { error: "Placar do visitante inválido." },
      { status: 400 },
    );
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, kickoff_at")
    .eq("id", payload.match_id)
    .single();

  if (matchError || !match) {
    return NextResponse.json(
      { error: "Jogo não encontrado." },
      { status: 404 },
    );
  }

  if (!participant.is_admin && new Date() >= new Date(match.kickoff_at)) {
    return NextResponse.json(
      { error: "O prazo para palpitar neste jogo já encerrou." },
      { status: 400 },
    );
  }

  const { error: upsertError } = await supabase.from("predictions").upsert(
    {
      user_id: participant.id,
      match_id: payload.match_id,
      predicted_home_score: payload.predicted_home_score,
      predicted_away_score: payload.predicted_away_score,
    },
    {
      onConflict: "user_id,match_id",
    },
  );

  if (upsertError) {
    return NextResponse.json(
      { error: normalizePredictionError(upsertError.message) },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

function normalizePredictionError(message: string) {
  if (message.includes("Predictions are locked after match kickoff")) {
    return "O prazo para palpitar neste jogo já encerrou.";
  }

  if (message.includes("Match not found")) {
    return "Jogo não encontrado.";
  }

  return message;
}
