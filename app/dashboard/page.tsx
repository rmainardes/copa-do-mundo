import Link from "next/link";
import AppNav from "../../components/app-nav";
import { requireParticipant } from "../../lib/current-participant";
import { createAdminClient } from "../../lib/supabase/admin";

export default async function DashboardPage() {
  const participant = await requireParticipant();
  const supabase = createAdminClient();

  const { count: totalMatches } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true });

  const { count: totalPredictions } = await supabase
    .from("predictions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", participant.id);

  const { data: rankingRow } = await supabase
    .from("ranking")
    .select("total_points, exact_score_count, result_hit_count")
    .eq("user_id", participant.id)
    .single();

  const matchesCount = totalMatches ?? 0;
  const predictionsCount = totalPredictions ?? 0;
  const pendingPredictions = Math.max(matchesCount - predictionsCount, 0);
  const totalPoints = rankingRow?.total_points ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <AppNav isAdmin={participant.is_admin} />

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Página inicial</h1>

              <p className="mt-2 text-slate-400">
                Você está participando como:
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-300">
                {participant.display_name ?? "Participante"}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Participante selecionado
            </div>
          </div>

          <h2 className="mt-8 text-xl font-semibold">
            Resumo dos seus palpites
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Jogos</p>
              <p className="mt-2 text-3xl font-bold">{matchesCount}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Palpites feitos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {predictionsCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Ainda faltam</p>
              <p className="mt-2 text-3xl font-bold text-amber-300">
                {pendingPredictions}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Seus pontos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {totalPoints}
              </p>
            </div>
          </div>

          {pendingPredictions > 0 ? (
            <p className="mt-5 text-sm text-amber-200">
              Você ainda tem jogos sem palpite. Entre em “Ver jogos” para
              completar.
            </p>
          ) : (
            <p className="mt-5 text-sm text-emerald-200">
              Todos os jogos cadastrados já têm seu palpite.
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Jogos</h2>

            <p className="mt-2 text-sm text-slate-400">
              Veja os jogos e registre seus palpites.
            </p>

            <Link
              href="/matches"
              className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Ver jogos
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Ranking</h2>

            <p className="mt-2 text-sm text-slate-400">
              Veja a classificação do bolão.
            </p>

            <Link
              href="/ranking"
              className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Ver ranking
            </Link>
          </div>

          {participant.is_admin && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold">Área do administrador</h2>

              <p className="mt-2 text-sm text-slate-400">
                Importar jogos e recalcular pontuação.
              </p>

              <Link
                href="/admin/import"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Abrir área do administrador
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
