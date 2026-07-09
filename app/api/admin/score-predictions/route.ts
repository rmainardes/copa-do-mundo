import { NextResponse } from "next/server";
import { getCurrentParticipant } from "../../../../lib/current-participant";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST() {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", participant.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: "Apenas administradores podem recalcular pontuação." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.rpc("score_all_finished_matches");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalMatches = data?.length ?? 0;
  const totalPredictions =
    data?.reduce(
      (sum: number, item: { predictions_scored: number }) =>
        sum + Number(item.predictions_scored ?? 0),
      0,
    ) ?? 0;

  return NextResponse.json({
    ok: true,
    total_matches: totalMatches,
    total_predictions: totalPredictions,
    details: data,
  });
}
