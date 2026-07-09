import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImportWorldCupButton from "@/components/import-world-cup-button";
import ScorePredictionsButton from "../../../components/score-predictions-button";
import AppNav from "../../../components/app-nav";
import Link from "next/link";
import { requireParticipant } from "@/lib/current-participant";

export default async function ImportPage() {
  const supabase = await createClient();

  const participant = await requireParticipant();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav isAdmin={participant.is_admin} />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold">Área do administrador</h1>

        <p className="mt-3 text-slate-400">
          Aqui você pode importar jogos e recalcular a pontuação do bolão.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <ImportWorldCupButton />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Pontuação</h2>

        <p className="mt-2 text-sm text-slate-400">
          Recalcula os pontos de todos os palpites em jogos finalizados.
        </p>

        <div className="mt-4">
          <ScorePredictionsButton />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Palpites em papel</h2>

        <p className="mt-2 text-sm text-slate-400">
          Cadastre palpites feitos fora do app para qualquer participante.
        </p>

        <Link
          href="/admin/predictions"
          className="mt-4 inline-block rounded-lg border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-slate-800"
        >
          Cadastrar palpites
        </Link>
      </div>
    </main>
  );
}
