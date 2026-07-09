import { NextResponse } from "next/server";
import { getCurrentParticipant } from "../../../../lib/current-participant";
import { createAdminClient } from "../../../../lib/supabase/admin";

type AdminSavePredictionPayload = {
  user_id?: string;
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

  if (!participant.is_admin) {
    return NextResponse.json(
      { error: "Apenas administradores podem executar esta ação." },
      { status: 403 },
    );
  }

  const supabase = createAdminClient();

  let payload: AdminSavePredictionPayload;

  try {
    payload = (await request.json()) as AdminSavePredictionPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (!payload.user_id) {
    return NextResponse.json(
      { error: "Participante não informado." },
      { status: 400 },
    );
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

  const { data: targetProfile, error: targetProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", payload.user_id)
    .single();

  if (targetProfileError || !targetProfile) {
    return NextResponse.json(
      { error: "Participante não encontrado." },
      { status: 404 },
    );
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", payload.match_id)
    .single();

  if (matchError || !match) {
    return NextResponse.json(
      { error: "Jogo não encontrado." },
      { status: 404 },
    );
  }

  const { error: upsertError } = await supabase.from("predictions").upsert(
    {
      user_id: payload.user_id,
      match_id: payload.match_id,
      predicted_home_score: payload.predicted_home_score,
      predicted_away_score: payload.predicted_away_score,
    },
    {
      onConflict: "user_id,match_id",
    },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
  });
}
