"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Participant = {
  id: string;
  display_name: string | null;
};

type MatchOption = {
  id: string;
  label: string;
};

type AdminPredictionFormProps = {
  participants: Participant[];
  matches: MatchOption[];
};

type SaveResponse = {
  ok?: boolean;
  error?: string;
};

export default function AdminPredictionForm({
  participants,
  matches,
}: AdminPredictionFormProps) {
  const router = useRouter();

  const [userId, setUserId] = useState(participants[0]?.id ?? "");
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/admin/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          match_id: matchId,
          predicted_home_score: Number(homeScore),
          predicted_away_score: Number(awayScore),
        }),
      });

      const data = (await response.json()) as SaveResponse;

      if (!response.ok) {
        setMessage(data.error ?? `Erro HTTP ${response.status}`);
        return;
      }

      setIsSuccess(true);
      setMessage("Palpite salvo com sucesso.");

      setHomeScore("");
      setAwayScore("");

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar palpite.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Participante
        </label>

        <select
          value={userId}
          disabled={isSaving}
          onChange={(event) => setUserId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
        >
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.display_name ?? "Participante sem nome"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">Jogo</label>

        <select
          value={matchId}
          disabled={isSaving}
          onChange={(event) => setMatchId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
        >
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Placar do primeiro time
          </label>

          <input
            type="number"
            min="0"
            required
            value={homeScore}
            disabled={isSaving}
            onChange={(event) => setHomeScore(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>

        <div className="pb-2 text-center text-lg font-bold text-slate-400">
          x
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">
            Placar do segundo time
          </label>

          <input
            type="number"
            min="0"
            required
            value={awayScore}
            disabled={isSaving}
            onChange={(event) => setAwayScore(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>
      </div>

      {message && (
        <div
          className={[
            "rounded-lg border p-3 text-sm",
            isSuccess
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving || !participants.length || !matches.length}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isSaving ? "Salvando..." : "Salvar palpite"}
      </button>
    </form>
  );
}
