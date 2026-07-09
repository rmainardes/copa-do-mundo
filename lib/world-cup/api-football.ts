import type {
  ImportedCompetition,
  ImportedMatchStage,
  ImportedMatchStatus,
} from "./import-types";

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballTeamResponse = {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    logo: string | null;
  };
};

type ApiFootballFixtureResponse = {
  fixture: {
    id: number;
    date: string;
    venue: {
      name: string | null;
      city: string | null;
    } | null;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number | null;
      name: string | null;
      logo: string | null;
      winner: boolean | null;
    };
    away: {
      id: number | null;
      name: string | null;
      logo: string | null;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty?: {
      home: number | null;
      away: number | null;
    } | null;
  };
};

type ApiFootballResponse<T> = {
  get: string;
  parameters: Record<string, string>;
  errors: unknown;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
};

async function apiFootballFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY não configurada no .env.local.");
  }

  const url = new URL(`${API_FOOTBALL_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Erro API-Football HTTP ${response.status}.`);
  }

  const data = (await response.json()) as T;

  return data;
}

export async function fetchWorldCupDataFromApiFootball(): Promise<ImportedCompetition> {
  const [teamsResponse, fixturesResponse] = await Promise.all([
    apiFootballFetch<ApiFootballResponse<ApiFootballTeamResponse>>("/teams", {
      league: "1",
      season: "2026",
    }),
    apiFootballFetch<ApiFootballResponse<ApiFootballFixtureResponse>>(
      "/fixtures",
      {
        league: "1",
        season: "2026",
      },
    ),
  ]);

  console.log("[API-Football] teams response:", {
    results: teamsResponse.results,
    errors: teamsResponse.errors,
    parameters: teamsResponse.parameters,
    responseLength: teamsResponse.response.length,
  });

  console.log("[API-Football] fixtures response:", {
    results: fixturesResponse.results,
    errors: fixturesResponse.errors,
    parameters: fixturesResponse.parameters,
    responseLength: fixturesResponse.response.length,
  });

  if (teamsResponse.response.length === 0) {
    throw new Error(
      `API-Football retornou 0 seleções. Verifique API key, plano, parâmetros league=1 season=2026 ou disponibilidade da competição. Erros: ${JSON.stringify(
        teamsResponse.errors,
      )}`,
    );
  }

  if (fixturesResponse.response.length === 0) {
    throw new Error(
      `API-Football retornou 0 jogos. Verifique API key, plano, parâmetros league=1 season=2026 ou disponibilidade da competição. Erros: ${JSON.stringify(
        fixturesResponse.errors,
      )}`,
    );
  }

  const teams = teamsResponse.response.map((item) => ({
    api_team_id: String(item.team.id),
    name: item.team.name,
    country_code: null,
    fifa_code: item.team.code,
    flag_url: item.team.logo,
  }));

  const matches = fixturesResponse.response.map((item) => {
    const homeTeamApiId = item.teams.home.id
      ? String(item.teams.home.id)
      : null;

    const awayTeamApiId = item.teams.away.id
      ? String(item.teams.away.id)
      : null;

    const winnerTeamApiId = getWinnerTeamApiId(item);

    return {
      api_match_id: String(item.fixture.id),
      stage: mapApiFootballRoundToStage(item.league.round),

      home_team_api_id: homeTeamApiId,
      away_team_api_id: awayTeamApiId,

      home_placeholder: homeTeamApiId ? null : item.teams.home.name,
      away_placeholder: awayTeamApiId ? null : item.teams.away.name,

      kickoff_at: item.fixture.date,
      venue: item.fixture.venue?.name ?? null,
      city: item.fixture.venue?.city ?? null,

      status: mapApiFootballStatusToMatchStatus(item.fixture.status.short),

      home_score: item.goals.home,
      away_score: item.goals.away,
      home_penalty_score: item.score.penalty?.home ?? null,
      away_penalty_score: item.score.penalty?.away ?? null,

      winner_team_api_id: winnerTeamApiId,

      bracket_position: item.league.round,
      winner_advances_to_api_match_id: null,
      loser_advances_to_api_match_id: null,
    };
  });

  return {
    name: "Copa do Mundo FIFA",
    year: 2026,
    api_source: "api-football",
    api_competition_id: "1-2026",
    teams,
    matches,
  };
}

function mapApiFootballRoundToStage(round: string): ImportedMatchStage {
  const normalized = round.toLowerCase();

  if (normalized.includes("round of 32")) {
    return "round_of_32";
  }

  if (normalized.includes("round of 16")) {
    return "round_of_16";
  }

  if (normalized.includes("quarter")) {
    return "quarter_final";
  }

  if (normalized.includes("semi")) {
    return "semi_final";
  }

  if (
    normalized.includes("3rd") ||
    normalized.includes("third") ||
    normalized.includes("place")
  ) {
    return "third_place";
  }

  if (normalized.includes("final")) {
    return "final";
  }

  return "group";
}

function mapApiFootballStatusToMatchStatus(
  statusShort: string,
): ImportedMatchStatus {
  switch (statusShort) {
    case "NS":
    case "TBD":
      return "scheduled";

    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "SUSP":
    case "INT":
      return "live";

    case "FT":
    case "AET":
    case "PEN":
      return "finished";

    case "PST":
      return "postponed";

    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled";

    default:
      return "scheduled";
  }
}

function getWinnerTeamApiId(item: ApiFootballFixtureResponse) {
  if (item.teams.home.winner === true && item.teams.home.id) {
    return String(item.teams.home.id);
  }

  if (item.teams.away.winner === true && item.teams.away.id) {
    return String(item.teams.away.id);
  }

  return null;
}
