import type {
  ImportedCompetition,
  ImportedMatchStage,
  ImportedMatchStatus,
} from "./import-types";

const BASE_URL = "https://worldcup26.ir";

type UnknownRecord = Record<string, unknown>;

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Erro WorldCup2026 API HTTP ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Resposta inválida da WorldCup2026 API: ${text}`);
  }
}

export async function fetchWorldCupDataFromOpenApi(): Promise<ImportedCompetition> {
  const [matchesRaw, teamsRaw] = await Promise.all([
    fetchJson("/get/games"),
    fetchJson("/get/teams"),
  ]);

  console.log("[WorldCup2026 API] matches sample:", sample(matchesRaw));
  console.log("[WorldCup2026 API] teams sample:", sample(teamsRaw));

  const teamsArray = extractArray(teamsRaw);
  const matchesArray = extractArray(matchesRaw);

  if (teamsArray.length === 0) {
    throw new Error(
      `WorldCup2026 API retornou 0 seleções. Amostra: ${JSON.stringify(
        sample(teamsRaw),
      )}`,
    );
  }

  if (matchesArray.length === 0) {
    throw new Error(
      `WorldCup2026 API retornou 0 jogos. Amostra: ${JSON.stringify(
        sample(matchesRaw),
      )}`,
    );
  }

  const teamsFromEndpoint = teamsArray.map((item, index) => {
    const record = asRecord(item);

    const id =
      getString(record, ["id", "_id", "team_id", "teamId", "code", "slug"]) ??
      String(index + 1);

    const name = getString(record, [
      "name_en",
      "name",
      "team",
      "country",
      "country_name",
    ]);

    if (!name) {
      throw new Error(
        `Time sem nome na WorldCup2026 API: ${JSON.stringify(record)}`,
      );
    }

    return {
      api_team_id: id,
      name,
      country_code: getString(record, [
        "iso2",
        "country_code",
        "countryCode",
        "code",
      ]),
      fifa_code: getString(record, ["fifa_code", "fifaCode"]),
      flag_url: getString(record, ["flag", "flag_url", "flagUrl", "logo"]),
    };
  });

  const teamsByApiId = new Map<
    string,
    {
      api_team_id: string;
      name: string;
      country_code: string | null;
      fifa_code: string | null;
      flag_url: string | null;
    }
  >();

  for (const team of teamsFromEndpoint) {
    teamsByApiId.set(team.api_team_id, team);
  }

  for (const item of matchesArray) {
    const record = asRecord(item);

    const homeTeamId = normalizeApiId(
      getString(record, ["home_team_id", "homeTeamId", "home_id"]),
    );

    const awayTeamId = normalizeApiId(
      getString(record, ["away_team_id", "awayTeamId", "away_id"]),
    );

    const homeTeamName = getString(record, [
      "home_team_name_en",
      "home_team",
      "homeTeam",
      "home",
      "team1",
      "home_name",
      "homeName",
    ]);

    const awayTeamName = getString(record, [
      "away_team_name_en",
      "away_team",
      "awayTeam",
      "away",
      "team2",
      "away_name",
      "awayName",
    ]);

    if (homeTeamId && homeTeamName && !teamsByApiId.has(homeTeamId)) {
      teamsByApiId.set(homeTeamId, {
        api_team_id: homeTeamId,
        name: homeTeamName,
        country_code: null,
        fifa_code: null,
        flag_url: null,
      });
    }

    if (awayTeamId && awayTeamName && !teamsByApiId.has(awayTeamId)) {
      teamsByApiId.set(awayTeamId, {
        api_team_id: awayTeamId,
        name: awayTeamName,
        country_code: null,
        fifa_code: null,
        flag_url: null,
      });
    }
  }

  const teams = Array.from(teamsByApiId.values());

  const teamIdByName = new Map(
    teams.map((team) => [normalizeName(team.name), team.api_team_id]),
  );

  const matches = matchesArray.map((item, index) => {
    const record = asRecord(item);

    const homeTeamName = getString(record, [
      "home_team_name_en",
      "home_team",
      "homeTeam",
      "home",
      "team1",
      "home_name",
      "homeName",
    ]);

    const awayTeamName = getString(record, [
      "away_team_name_en",
      "away_team",
      "awayTeam",
      "away",
      "team2",
      "away_name",
      "awayName",
    ]);

    const rawHomeTeamId = normalizeApiId(
      getString(record, ["home_team_id", "homeTeamId", "home_id"]),
    );

    const rawAwayTeamId = normalizeApiId(
      getString(record, ["away_team_id", "awayTeamId", "away_id"]),
    );

    const homeTeamId =
      rawHomeTeamId ??
      (homeTeamName ? teamIdByName.get(normalizeName(homeTeamName)) : null);

    const awayTeamId =
      rawAwayTeamId ??
      (awayTeamName ? teamIdByName.get(normalizeName(awayTeamName)) : null);

    const finished = getString(record, ["finished"]);
    const timeElapsed = getString(record, ["time_elapsed"]);
    const type = getString(record, ["type"]) ?? "";
    const group = getString(record, ["group"]);

    return {
      api_match_id:
        getString(record, ["id", "_id", "match_id", "matchId"]) ??
        String(index + 1),

      stage: mapStage(type),

      home_team_api_id: homeTeamId ?? null,
      away_team_api_id: awayTeamId ?? null,

      home_placeholder: homeTeamId
        ? null
        : (homeTeamName ?? getPlaceholderFromMatch(record, "home")),

      away_placeholder: awayTeamId
        ? null
        : (awayTeamName ?? getPlaceholderFromMatch(record, "away")),

      kickoff_at: parseWorldCup26Date(
        getString(record, [
          "local_date",
          "kickoff_at",
          "kickoffAt",
          "date",
          "datetime",
        ]),
      ),

      venue: getString(record, ["venue", "stadium"]),
      city: getString(record, ["city"]),

      status: mapWorldCup26Status({
        finished,
        timeElapsed,
        rawStatus: getString(record, ["status"]),
      }),

      home_score: getNumber(record, ["home_score", "homeScore", "score1"]),
      away_score: getNumber(record, ["away_score", "awayScore", "score2"]),

      home_penalty_score: getNumber(record, [
        "home_penalty_score",
        "homePenaltyScore",
      ]),
      away_penalty_score: getNumber(record, [
        "away_penalty_score",
        "awayPenaltyScore",
      ]),

      winner_team_api_id: null,

      bracket_position: group
        ? `Grupo ${group} · Rodada ${getString(record, ["matchday"]) ?? "-"}`
        : type,

      winner_advances_to_api_match_id: null,
      loser_advances_to_api_match_id: null,
    };
  });

  console.log("[WorldCup2026 API] normalized:", {
    teams: teams.length,
    matches: matches.length,
    firstTeams: teams.slice(0, 5),
    firstMatches: matches.slice(0, 2),
  });

  return {
    name: "Copa do Mundo FIFA",
    year: 2026,
    api_source: "worldcup2026-open-api",
    api_competition_id: "worldcup-2026",
    teams,
    matches,
  };
}

function mapWorldCup26Status({
  finished,
  timeElapsed,
  rawStatus,
}: {
  finished: string | null;
  timeElapsed: string | null;
  rawStatus: string | null;
}): ImportedMatchStatus {
  if (finished?.toLowerCase() === "true") {
    return "finished";
  }

  if (timeElapsed?.toLowerCase() === "finished") {
    return "finished";
  }

  if (rawStatus) {
    return mapStatus(rawStatus);
  }

  return "scheduled";
}

function parseWorldCup26Date(value: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return new Date().toISOString();
  }

  const [, month, day, year, hour, minute] = match;

  // A API usa horário local do jogo no formato MM/DD/YYYY HH:mm.
  // Como ainda não temos timezone por estádio, salvamos em UTC aproximado.
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
    ),
  ).toISOString();
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as UnknownRecord;

  for (const key of [
    "data",
    "response",
    "items",
    "matches",
    "games",
    "teams",
    "results",
  ]) {
    const candidate = record[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function sample(value: unknown) {
  if (Array.isArray(value)) {
    return value.slice(0, 2);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as UnknownRecord;
  const sampled: UnknownRecord = {};

  for (const [key, innerValue] of Object.entries(record).slice(0, 8)) {
    sampled[key] = Array.isArray(innerValue)
      ? innerValue.slice(0, 2)
      : innerValue;
  }

  return sampled;
}

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as UnknownRecord;
}

function getString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as UnknownRecord;

      for (const nestedKey of ["id", "name", "code"]) {
        const nestedValue = nested[nestedKey];

        if (typeof nestedValue === "string" && nestedValue.trim()) {
          return nestedValue.trim();
        }

        if (typeof nestedValue === "number") {
          return String(nestedValue);
        }
      }
    }
  }

  return null;
}

function getNumber(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function mapStage(value: string): ImportedMatchStage {
  const normalized = value.toLowerCase();

  if (normalized === "group" || normalized.includes("group")) {
    return "group";
  }

  if (normalized.includes("round of 32") || normalized.includes("32")) {
    return "round_of_32";
  }

  if (normalized.includes("round of 16") || normalized.includes("16")) {
    return "round_of_16";
  }

  if (normalized.includes("quarter") || normalized.includes("8")) {
    return "quarter_final";
  }

  if (normalized.includes("semi") || normalized.includes("4")) {
    return "semi_final";
  }

  if (
    normalized.includes("third") ||
    normalized.includes("3rd") ||
    normalized.includes("place")
  ) {
    return "third_place";
  }

  if (normalized.includes("final")) {
    return "final";
  }

  return "group";
}

function mapStatus(value: string): ImportedMatchStatus {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("finished") ||
    normalized.includes("full") ||
    normalized.includes("ft")
  ) {
    return "finished";
  }

  if (
    normalized.includes("live") ||
    normalized.includes("progress") ||
    normalized.includes("playing")
  ) {
    return "live";
  }

  if (normalized.includes("postponed")) {
    return "postponed";
  }

  if (normalized.includes("cancelled") || normalized.includes("canceled")) {
    return "cancelled";
  }

  return "scheduled";
}

function normalizeApiId(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (
    normalized === "" ||
    normalized === "0" ||
    normalized.toLowerCase() === "null" ||
    normalized.toLowerCase() === "undefined" ||
    normalized.toLowerCase() === "tbd"
  ) {
    return null;
  }

  return normalized;
}

function getPlaceholderFromMatch(record: UnknownRecord, side: "home" | "away") {
  const type = getString(record, ["type"]) ?? "";
  const group = getString(record, ["group"]);
  const matchday = getString(record, ["matchday"]);

  if (type.toLowerCase().includes("group")) {
    return side === "home" ? "Mandante indefinido" : "Visitante indefinido";
  }

  if (group) {
    return `${side === "home" ? "Mandante" : "Visitante"} · Grupo ${group}`;
  }

  if (matchday) {
    return `${side === "home" ? "Mandante" : "Visitante"} · Jogo ${matchday}`;
  }

  return side === "home" ? "Mandante indefinido" : "Visitante indefinido";
}
