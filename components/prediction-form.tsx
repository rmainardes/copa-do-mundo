"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PredictionFormProps = {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  isLocked: boolean;
  nextPendingMatchId?: string | null;
  initialPrediction: {
    predicted_home_score: number;
    predicted_away_score: number;
  } | null;
};

type SavePredictionResponse = {
  ok?: boolean;
  error?: string;
};

export default function PredictionForm({
  matchId,
  homeTeamName,
  awayTeamName,
  isLocked,
  nextPendingMatchId,
  initialPrediction,
}: PredictionFormProps) {
  const router = useRouter();

  const [wasSaved, setWasSaved] = useState(false);

  const [homeScore, setHomeScore] = useState(
    initialPrediction?.predicted_home_score?.toString() ?? "",
  );

  const [awayScore, setAwayScore] = useState(
    initialPrediction?.predicted_away_score?.toString() ?? "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const numericHomeScore = homeScore === "" ? null : Number(homeScore);
  const numericAwayScore = awayScore === "" ? null : Number(awayScore);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: matchId,
          predicted_home_score: numericHomeScore,
          predicted_away_score: numericAwayScore,
        }),
      });

      const data = (await response.json()) as SavePredictionResponse;

      if (!response.ok) {
        setMessage(data.error ?? `Erro HTTP ${response.status}`);
        return;
      }

      setIsSuccess(true);
      setWasSaved(true);
      setMessage("Palpite salvo com sucesso.");
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
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            {homeTeamName}
          </label>

          <input
            type="number"
            min="0"
            required
            disabled={isLocked || isSaving}
            value={homeScore}
            onChange={(event) => setHomeScore(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>

        <div className="pb-2 text-center text-lg font-bold text-slate-400">
          x
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">
            {awayTeamName}
          </label>

          <input
            type="number"
            min="0"
            required
            disabled={isLocked || isSaving}
            value={awayScore}
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
      {wasSaved && isSuccess && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4 sm:flex-row">
          {nextPendingMatchId ? (
            <button
              type="button"
              onClick={() => router.push(`/matches/${nextPendingMatchId}`)}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Próximo jogo sem palpite
            </button>
          ) : (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              Você já fez todos os palpites disponíveis.
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/matches")}
            className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-900"
          >
            Voltar para jogos
          </button>

          <button
            type="button"
            onClick={() => router.push("/ranking")}
            className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-900"
          >
            Ver ranking
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={isLocked || isSaving}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isSaving ? "Salvando..." : "Salvar palpite"}
      </button>
    </form>
  );
}
