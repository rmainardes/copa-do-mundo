"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

type MatchResultFormProps = {
  matchId: string;
  initialStatus: MatchStatus;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
  homeTeamName: string;
  awayTeamName: string;
};

type UpdateResultResponse = {
  ok?: boolean;
  error?: string;
};

export default function MatchResultForm({
  matchId,
  initialStatus,
  initialHomeScore,
  initialAwayScore,
  homeTeamName,
  awayTeamName,
}: MatchResultFormProps) {
  const router = useRouter();

  const [status, setStatus] = useState<MatchStatus>(initialStatus);
  const [homeScore, setHomeScore] = useState(
    initialHomeScore?.toString() ?? "",
  );
  const [awayScore, setAwayScore] = useState(
    initialAwayScore?.toString() ?? "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setIsSuccess(false);

    const parsedHomeScore = homeScore === "" ? null : Number(homeScore);
    const parsedAwayScore = awayScore === "" ? null : Number(awayScore);

    try {
      const response = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: matchId,
          status,
          home_score: parsedHomeScore,
          away_score: parsedAwayScore,
        }),
      });

      const data = (await response.json()) as UpdateResultResponse;

      if (!response.ok) {
        setMessage(data.error ?? `Erro HTTP ${response.status}`);
        return;
      }

      setIsSuccess(true);
      setMessage("Resultado salvo com sucesso.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar resultado.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Status do jogo
        </label>

        <select
          value={status}
          disabled={isSaving}
          onChange={(event) => setStatus(event.target.value as MatchStatus)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
        >
          <option value="scheduled">Agendado</option>
          <option value="live">Ao vivo</option>
          <option value="finished">Finalizado</option>
          <option value="postponed">Adiado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            {homeTeamName}
          </label>

          <input
            type="number"
            min="0"
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
            {awayTeamName}
          </label>

          <input
            type="number"
            min="0"
            value={awayScore}
            disabled={isSaving}
            onChange={(event) => setAwayScore(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>
      </div>

      {status === "finished" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Ao marcar como finalizado, informe o placar real até o fim da
          prorrogação. Depois use “Recalcular pontuação” na área do
          administrador.
        </p>
      )}

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
        disabled={isSaving}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isSaving ? "Salvando..." : "Salvar resultado"}
      </button>
    </form>
  );
}
