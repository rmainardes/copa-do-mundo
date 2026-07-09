"use client";

import { useState } from "react";

type ScoreResult = {
  ok?: boolean;
  error?: string;
  total_matches?: number;
  total_predictions?: number;
};

export default function ScorePredictionsButton() {
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);

  async function handleScore() {
    setIsScoring(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/score-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as ScoreResult;

      if (!response.ok) {
        setResult({
          error: data.error ?? `Erro HTTP ${response.status}`,
        });
        return;
      }

      setResult(data);
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao recalcular pontuação.",
      });
    } finally {
      setIsScoring(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleScore}
        disabled={isScoring}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isScoring ? "Recalculando..." : "Recalcular pontuação"}
      </button>

      {result && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm">
          {result.ok ? (
            <div className="space-y-1 text-slate-300">
              <p>Pontuação recalculada.</p>
              <p>Jogos processados: {result.total_matches}</p>
              <p>Palpites pontuados: {result.total_predictions}</p>
            </div>
          ) : (
            <p className="text-red-300">
              {result.error ?? "Erro ao recalcular pontuação."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
