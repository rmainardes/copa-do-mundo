"use client";

import { useState } from "react";

type ImportResult = {
  ok?: boolean;
  error?: string;
  competition_id?: string;
  imported_teams?: number;
  imported_matches?: number;
};

export default function ImportWorldCupButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    setIsImporting(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/import-world-cup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as ImportResult;

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
            : "Erro inesperado ao importar.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleImport}
        disabled={isImporting}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isImporting ? "Importando..." : "Importar jogos"}
      </button>

      {result && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm">
          {result.ok ? (
            <div className="space-y-1 text-slate-300">
              <p>Importação concluída.</p>
              <p>Times importados: {result.imported_teams}</p>
              <p>Jogos importados: {result.imported_matches}</p>
            </div>
          ) : (
            <p className="text-red-300">
              {result.error ?? "Erro ao importar."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
