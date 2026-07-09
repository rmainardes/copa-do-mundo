import { redirect } from "next/navigation";
import AppNav from "../../../components/app-nav";
import AdminPredictionForm from "../../../components/admin-prediction-form";
import { createClient } from "../../../lib/supabase/server";
import { translateTeamName } from "../../../lib/world-cup/team-translations";
import {
  translateMatchStage,
  translateMatchStatus,
} from "../../../lib/world-cup/match-labels";
import { requireParticipant } from "../../../lib/current-participant";

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

function getTeamLabel(team: TeamRelation, placeholder: string | null) {
  const selectedTeam = getTeam(team);

  if (!selectedTeam?.name) {
    return placeholder ?? "Time indefinido";
  }

  return translateTeamName({
    name: selectedTeam.name,
    fifaCode: selectedTeam.fifa_code,
  });
}

function formatMatchDate(kickoffAt: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(kickoffAt));
}

export default async function AdminPredictionsPage() {
  const supabase = await createClient();

  const participant = await requireParticipant();

  const { data: participants, error: participantsError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  if (participantsError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <AppNav isAdmin />

        <div className="mx-auto max-w-4xl px-6 py-8">
          <p>Erro ao carregar participantes: {participantsError.message}</p>
        </div>
      </main>
    );
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      `
      id,
      kickoff_at,
      stage,
      status,
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

        <div className="mx-auto max-w-4xl px-6 py-8">
          <p>Erro ao carregar jogos: {matchesError.message}</p>
        </div>
      </main>
    );
  }

  const matchOptions =
    matches?.map((match) => {
      const homeTeamLabel = getTeamLabel(
        match.home_team,
        match.home_placeholder,
      );

      const awayTeamLabel = getTeamLabel(
        match.away_team,
        match.away_placeholder,
      );

      return {
        id: match.id,
        label: `${formatMatchDate(match.kickoff_at)} — ${homeTeamLabel} x ${awayTeamLabel} — ${translateMatchStage(match.stage)} — ${translateMatchStatus(match.status)}`,
      };
    }) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav isAdmin />

      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-3xl font-bold">
          Cadastrar palpites de participantes
        </h1>

        <p className="mt-3 text-slate-400">
          Use esta tela para lançar palpites que foram feitos em papel ou fora
          do app.
        </p>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <AdminPredictionForm
            participants={participants ?? []}
            matches={matchOptions}
          />
        </section>

        <section className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p>
            Depois de lançar palpites de jogos já finalizados, volte para a área
            do administrador e clique em “Recalcular pontuação”.
          </p>
        </section>
      </div>
    </main>
  );
}
