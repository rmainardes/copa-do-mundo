import Link from "next/link";
import { notFound } from "next/navigation";
import PredictionForm from "../../../components/prediction-form";
import MatchResultForm from "../../../components/match-result-form";
import AppNav from "../../../components/app-nav";
import { requireParticipant } from "../../../lib/current-participant";
import { createAdminClient } from "../../../lib/supabase/admin";
import { translateTeamName } from "../../../lib/world-cup/team-translations";
import {
  translateMatchStage,
  translateMatchStatus,
} from "../../../lib/world-cup/match-labels";

type MatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

type TeamRelation =
  | {
      id: string;
      name: string | null;
      fifa_code: string | null;
      flag_url: string | null;
    }
  | {
      id: string;
      name: string | null;
      fifa_code: string | null;
      flag_url: string | null;
    }[]
  | null;

function getTeam(team: TeamRelation) {
  if (Array.isArray(team)) {
    return team[0] ?? null;
  }

  return team;
}

function getTeamLabel(team: TeamRelation, placeholder?: string | null) {
  const selectedTeam = getTeam(team);

  if (!selectedTeam?.name) {
    return placeholder ?? "Time indefinido";
  }

  const translatedName = translateTeamName({
    name: selectedTeam.name,
    fifaCode: selectedTeam.fifa_code,
  });

  return selectedTeam.fifa_code
    ? `${translatedName} (${selectedTeam.fifa_code})`
    : translatedName;
}

function formatMatchDate(kickoffAt: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(kickoffAt));
}

function isPredictionLocked(kickoffAt: string, isAdmin: boolean) {
  if (isAdmin) {
    return false;
  }

  return new Date() >= new Date(kickoffAt);
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { id } = await params;

  const participant = await requireParticipant();
  const supabase = createAdminClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      `
      id,
      kickoff_at,
      stage,
      status,
      venue,
      city,
      home_score,
      away_score,
      home_penalty_score,
      away_penalty_score,
      home_placeholder,
      away_placeholder,
      home_team:teams!matches_home_team_id_fkey(id, name, fifa_code, flag_url),
      away_team:teams!matches_away_team_id_fkey(id, name, fifa_code, flag_url)
    `,
    )
    .eq("id", id)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const { data: prediction } = await supabase
    .from("predictions")
    .select(
      `
      id,
      predicted_home_score,
      predicted_away_score,
      points,
      scored_at
    `,
    )
    .eq("match_id", id)
    .eq("user_id", participant.id)
    .maybeSingle();

  const homeTeamLabel = getTeamLabel(match.home_team, match.home_placeholder);
  const awayTeamLabel = getTeamLabel(match.away_team, match.away_placeholder);

  const { data: userPredictions } = await supabase
    .from("predictions")
    .select("match_id")
    .eq("user_id", participant.id);

  const predictedMatchIds = new Set(
    (userPredictions ?? []).map((prediction) => prediction.match_id),
  );

  const { data: openMatches } = await supabase
    .from("matches")
    .select("id, kickoff_at")
    .neq("status", "finished")
    .gt("kickoff_at", new Date().toISOString())
    .order("kickoff_at", { ascending: true });

  const nextPendingMatch = (openMatches ?? []).find(
    (openMatch) =>
      openMatch.id !== match.id && !predictedMatchIds.has(openMatch.id),
  );

  const isAdmin = participant.is_admin;
  const locked = isPredictionLocked(match.kickoff_at, isAdmin);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav isAdmin={isAdmin} />

      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href="/matches"
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          ← Voltar para jogos
        </Link>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-sm uppercase tracking-wide text-slate-500">
            {translateMatchStage(match.stage)} ·{" "}
            {translateMatchStatus(match.status)}
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            {homeTeamLabel} x {awayTeamLabel}
          </h1>

          <p className="mt-3 text-slate-400">
            {formatMatchDate(match.kickoff_at)}
          </p>

          {(match.venue || match.city) && (
            <p className="mt-1 text-sm text-slate-500">
              {[match.venue, match.city].filter(Boolean).join(" · ")}
            </p>
          )}

          {match.status === "finished" && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Resultado final</p>

              <p className="mt-2 text-2xl font-bold">
                {match.home_score ?? "-"} x {match.away_score ?? "-"}
              </p>

              {(match.home_penalty_score !== null ||
                match.away_penalty_score !== null) && (
                <p className="mt-1 text-sm text-slate-400">
                  Pênaltis: {match.home_penalty_score ?? "-"} x{" "}
                  {match.away_penalty_score ?? "-"}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Seu palpite</h2>

          {locked && (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              O prazo para palpitar neste jogo já encerrou.
            </p>
          )}

          {isAdmin && new Date() >= new Date(match.kickoff_at) && (
            <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Você é admin, então pode corrigir ou inserir palpites mesmo após o
              início do jogo.
            </p>
          )}

          <PredictionForm
            matchId={match.id}
            homeTeamName={homeTeamLabel}
            awayTeamName={awayTeamLabel}
            isLocked={locked}
            nextPendingMatchId={nextPendingMatch?.id ?? null}
            initialPrediction={
              prediction
                ? {
                    predicted_home_score: prediction.predicted_home_score ?? 0,
                    predicted_away_score: prediction.predicted_away_score ?? 0,
                  }
                : null
            }
          />
        </section>

        {isAdmin && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Resultado do jogo</h2>

            <p className="mt-2 text-sm text-slate-400">
              Área visível apenas para administradores. Use para informar ou
              corrigir o placar real do jogo.
            </p>

            <MatchResultForm
              matchId={match.id}
              initialStatus={match.status as MatchStatus}
              initialHomeScore={match.home_score}
              initialAwayScore={match.away_score}
              homeTeamName={homeTeamLabel}
              awayTeamName={awayTeamLabel}
            />

            <Link
              href="/admin/import"
              className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Ir para área do administrador e recalcular pontuação
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
