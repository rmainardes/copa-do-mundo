import { NextResponse } from "next/server";
import { getCurrentParticipant } from "../../../../lib/current-participant";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { fetchWorldCupDataFromOpenApi } from "@/lib/world-cup/worldcup2026-api";
import type { ImportedCompetition } from "../../../../lib/world-cup/import-types";

type TeamRow = {
  id: string;
  api_team_id: string | null;
};

type MatchRow = {
  id: string;
  api_match_id: string | null;
};

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

  try {
    const worldCupData = await fetchWorldCupDataFromOpenApi();
    const result = await importCompetition(worldCupData);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido na importação.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function importCompetition(payload: ImportedCompetition) {
  const supabase = await createAdminClient();

  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .upsert(
      {
        name: payload.name,
        year: payload.year,
        api_source: payload.api_source,
        api_competition_id: payload.api_competition_id,
      },
      {
        onConflict: "name,year",
      },
    )
    .select("id")
    .single();

  if (competitionError) {
    throw new Error(`Erro ao salvar competição: ${competitionError.message}`);
  }

  if (!competition?.id) {
    throw new Error("Competição não encontrada após upsert.");
  }

  const competitionId = competition.id as string;

  const teamsToUpsert = payload.teams.map((team) => ({
    competition_id: competitionId,
    api_team_id: team.api_team_id,
    name: team.name,
    country_code: team.country_code ?? null,
    fifa_code: team.fifa_code ?? null,
    flag_url: team.flag_url ?? null,
  }));

  const { data: upsertedTeams, error: teamsError } = await supabase
    .from("teams")
    .upsert(teamsToUpsert, {
      onConflict: "competition_id,api_team_id",
    })
    .select("id, api_team_id");

  if (teamsError) {
    throw new Error(`Erro ao salvar seleções: ${teamsError.message}`);
  }

  const teamMap = new Map<string, string>();

  for (const team of (upsertedTeams ?? []) as TeamRow[]) {
    if (team.api_team_id) {
      teamMap.set(team.api_team_id, team.id);
    }
  }

  const matchesToUpsert = payload.matches.map((match) => {
    const homeTeamId = match.home_team_api_id
      ? teamMap.get(match.home_team_api_id)
      : null;

    const awayTeamId = match.away_team_api_id
      ? teamMap.get(match.away_team_api_id)
      : null;

    const winnerTeamId = match.winner_team_api_id
      ? teamMap.get(match.winner_team_api_id)
      : null;

    if (match.home_team_api_id && !homeTeamId) {
      throw new Error(
        `Time mandante não encontrado: ${match.home_team_api_id}`,
      );
    }

    if (match.away_team_api_id && !awayTeamId) {
      throw new Error(
        `Time visitante não encontrado: ${match.away_team_api_id}`,
      );
    }

    if (match.winner_team_api_id && !winnerTeamId) {
      throw new Error(
        `Time vencedor não encontrado: ${match.winner_team_api_id}`,
      );
    }

    return {
      competition_id: competitionId,
      api_match_id: match.api_match_id,
      stage: match.stage,

      home_team_id: homeTeamId ?? null,
      away_team_id: awayTeamId ?? null,

      home_placeholder: match.home_placeholder ?? null,
      away_placeholder: match.away_placeholder ?? null,

      kickoff_at: match.kickoff_at,
      venue: match.venue ?? null,
      city: match.city ?? null,

      status: match.status,

      home_score: match.home_score ?? null,
      away_score: match.away_score ?? null,
      home_penalty_score: match.home_penalty_score ?? null,
      away_penalty_score: match.away_penalty_score ?? null,

      winner_team_id: winnerTeamId ?? null,

      bracket_position: match.bracket_position ?? null,
    };
  });

  const { data: upsertedMatches, error: matchesError } = await supabase
    .from("matches")
    .upsert(matchesToUpsert, {
      onConflict: "competition_id,api_match_id",
    })
    .select("id, api_match_id");

  if (matchesError) {
    throw new Error(`Erro ao salvar jogos: ${matchesError.message}`);
  }

  await updateMatchAdvancementEdges({
    competitionId,
    matches: payload.matches,
    upsertedMatches: (upsertedMatches ?? []) as MatchRow[],
  });

  return {
    competition_id: competitionId,
    imported_teams: teamsToUpsert.length,
    imported_matches: matchesToUpsert.length,
  };
}

async function updateMatchAdvancementEdges({
  competitionId,
  matches,
  upsertedMatches,
}: {
  competitionId: string;
  matches: ImportedCompetition["matches"];
  upsertedMatches: MatchRow[];
}) {
  const supabase = await createAdminClient();

  const matchMap = new Map<string, string>();

  for (const match of upsertedMatches) {
    if (match.api_match_id) {
      matchMap.set(match.api_match_id, match.id);
    }
  }

  for (const match of matches) {
    const currentMatchId = matchMap.get(match.api_match_id);

    if (!currentMatchId) {
      continue;
    }

    const winnerAdvancesToMatchId = match.winner_advances_to_api_match_id
      ? matchMap.get(match.winner_advances_to_api_match_id)
      : null;

    const loserAdvancesToMatchId = match.loser_advances_to_api_match_id
      ? matchMap.get(match.loser_advances_to_api_match_id)
      : null;

    if (!winnerAdvancesToMatchId && !loserAdvancesToMatchId) {
      continue;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        winner_advances_to_match_id: winnerAdvancesToMatchId,
        loser_advances_to_match_id: loserAdvancesToMatchId,
      })
      .eq("competition_id", competitionId)
      .eq("api_match_id", match.api_match_id);

    if (error) {
      throw new Error(
        `Erro ao atualizar avanço da chave do jogo ${match.api_match_id}: ${error.message}`,
      );
    }
  }
}
