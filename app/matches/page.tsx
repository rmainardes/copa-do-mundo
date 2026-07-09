import Link from "next/link";
import AppNav from "../../components/app-nav";
import { requireParticipant } from "../../lib/current-participant";
import { createAdminClient } from "../../lib/supabase/admin";
import { translateTeamName } from "../../lib/world-cup/team-translations";
import {
  translateMatchStage,
  translateMatchStatus,
} from "../../lib/world-cup/match-labels";

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

type PredictionSummary = {
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
};

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
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(kickoffAt));
}

function isMatchLocked(kickoffAt: string) {
  return new Date() >= new Date(kickoffAt);
}

export default async function MatchesPage() {
  const participant = await requireParticipant();
  const supabase = createAdminClient();

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      `
      id,
      kickoff_at,
      home_score,
      away_score,
      status,
      stage,
      home_placeholder,
      away_placeholder,
      home_team:teams!matches_home_team_id_fkey(id, name, fifa_code, flag_url),
      away_team:teams!matches_away_team_id_fkey(id, name, fifa_code, flag_url)
    `,
    )
    .order("kickoff_at", { ascending: true });

  if (matchesError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <AppNav isAdmin={participant.is_admin} />

        <div className="mx-auto max-w-5xl px-6 py-8">
          <p>Erro ao carregar jogos: {matchesError.message}</p>
        </div>
      </main>
    );
  }

  const matchIds = matches?.map((match) => match.id) ?? [];

  const { data: predictions, error: predictionsError } = matchIds.length
    ? await supabase
        .from("predictions")
        .select(
          `
          match_id,
          predicted_home_score,
          predicted_away_score
        `,
        )
        .eq("user_id", participant.id)
        .in("match_id", matchIds)
    : { data: [], error: null };

  if (predictionsError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <AppNav isAdmin={participant.is_admin} />

        <div className="mx-auto max-w-5xl px-6 py-8">
          <p>Erro ao carregar palpites: {predictionsError.message}</p>
        </div>
      </main>
    );
  }

  const predictionsByMatchId = new Map<string, PredictionSummary>();

  for (const prediction of (predictions ?? []) as PredictionSummary[]) {
    predictionsByMatchId.set(prediction.match_id, prediction);
  }

  const pendingMatches = [...(matches ?? [])]
    .filter((match) => {
      const hasPrediction = predictionsByMatchId.has(match.id);
      const locked = isMatchLocked(match.kickoff_at);

      return !hasPrediction && !locked && match.status !== "finished";
    })
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );

  const predictedMatches = [...(matches ?? [])]
    .filter((match) => {
      const hasPrediction = predictionsByMatchId.has(match.id);

      return hasPrediction && match.status !== "finished";
    })
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );

  const finishedMatches = [...(matches ?? [])]
    .filter((match) => match.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
    );

  const lockedWithoutPredictionMatches = [...(matches ?? [])]
    .filter((match) => {
      const hasPrediction = predictionsByMatchId.has(match.id);
      const locked = isMatchLocked(match.kickoff_at);

      return !hasPrediction && locked && match.status !== "finished";
    })
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
    );

  const totalMatches = matches?.length ?? 0;
  const totalPredictions = predictions?.length ?? 0;
  const openPendingPredictions = pendingMatches.length;
  const lockedWithoutPredictionCount = lockedWithoutPredictionMatches.length;

  function renderMatchSection({
    title,
    description,
    sectionMatches,
    emptyMessage,
  }: {
    title: string;
    description: string;
    sectionMatches: NonNullable<typeof matches>;
    emptyMessage: string;
  }) {
    return (
      <section className="mt-8">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>

          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>

        <div className="mt-4 space-y-3">
          {sectionMatches.map((match) => {
            const prediction = predictionsByMatchId.get(match.id);
            const locked = isMatchLocked(match.kickoff_at);

            return (
              <div
                key={match.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm text-slate-400">
                      {formatMatchDate(match.kickoff_at)}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-lg font-semibold">
                      <span>
                        {getTeamLabel(match.home_team, match.home_placeholder)}
                      </span>

                      <span className="text-slate-500">x</span>

                      <span>
                        {getTeamLabel(match.away_team, match.away_placeholder)}
                      </span>
                    </div>

                    <div className="mt-2 text-xs uppercase text-slate-500">
                      {translateMatchStage(match.stage)} ·{" "}
                      {translateMatchStatus(match.status)}
                    </div>

                    {match.status === "finished" && (
                      <div className="mt-2 text-sm text-slate-300">
                        Resultado:{" "}
                        <strong>
                          {match.home_score ?? "-"} x {match.away_score ?? "-"}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="min-w-48 md:text-right">
                    {prediction ? (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                        <p className="font-semibold">Palpite feito</p>
                        <p className="mt-1 text-lg font-bold">
                          {prediction.predicted_home_score} x{" "}
                          {prediction.predicted_away_score}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                        <p className="font-semibold">Pendente</p>
                        <p className="mt-1">
                          {locked
                            ? "Prazo encerrado"
                            : "Você ainda não palpitou"}
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/matches/${match.id}`}
                      className="mt-3 inline-block rounded-lg border border-emerald-500 px-3 py-1.5 text-sm font-semibold text-emerald-400 hover:bg-slate-800"
                    >
                      {prediction ? "Editar palpite" : "Palpitar"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {sectionMatches.length === 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
              {emptyMessage}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav isAdmin={participant.is_admin} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Jogos</h1>

          <p className="mt-2 text-slate-400">
            Veja os jogos e registre seus palpites.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Jogos cadastrados</p>
            <p className="mt-2 text-3xl font-bold">{totalMatches}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Palpites feitos</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">
              {totalPredictions}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Abertos sem palpite</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">
              {openPendingPredictions}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Perdidos</p>
            <p className="mt-2 text-3xl font-bold text-red-300">
              {lockedWithoutPredictionCount}
            </p>
          </div>
        </section>

        {renderMatchSection({
          title: "Faltam seus palpites",
          description:
            "Jogos abertos em que você ainda não registrou seu palpite.",
          sectionMatches: pendingMatches,
          emptyMessage: "Você não tem palpites pendentes em jogos abertos.",
        })}

        {renderMatchSection({
          title: "Palpites já feitos",
          description: "Jogos em que seu palpite já está registrado.",
          sectionMatches: predictedMatches,
          emptyMessage: "Você ainda não registrou palpites em jogos abertos.",
        })}

        {renderMatchSection({
          title: "Prazo encerrado sem palpite",
          description:
            "Jogos que já começaram e ficaram sem palpite registrado.",
          sectionMatches: lockedWithoutPredictionMatches,
          emptyMessage: "Nenhum jogo ficou sem palpite até agora.",
        })}

        {renderMatchSection({
          title: "Jogos encerrados",
          description: "Resultados já finalizados e usados para pontuação.",
          sectionMatches: finishedMatches,
          emptyMessage: "Ainda não há jogos encerrados.",
        })}
      </div>
    </main>
  );
}
