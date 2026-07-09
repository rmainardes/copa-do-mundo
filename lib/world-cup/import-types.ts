export type ImportedTeam = {
  api_team_id: string;
  name: string;
  country_code?: string | null;
  fifa_code?: string | null;
  flag_url?: string | null;
};

export type ImportedMatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type ImportedMatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type ImportedMatch = {
  api_match_id: string;
  stage: ImportedMatchStage;

  home_team_api_id?: string | null;
  away_team_api_id?: string | null;

  home_placeholder?: string | null;
  away_placeholder?: string | null;

  kickoff_at: string;
  venue?: string | null;
  city?: string | null;

  status: ImportedMatchStatus;

  home_score?: number | null;
  away_score?: number | null;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;

  winner_team_api_id?: string | null;

  bracket_position?: string | null;
  winner_advances_to_api_match_id?: string | null;
  loser_advances_to_api_match_id?: string | null;
};

export type ImportedCompetition = {
  name: string;
  year: number;
  api_source?: string | null;
  api_competition_id?: string | null;
  teams: ImportedTeam[];
  matches: ImportedMatch[];
};
