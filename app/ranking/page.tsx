import AppNav from "../../components/app-nav";
import { requireParticipant } from "@/lib/current-participant";
import { createAdminClient } from "../../lib/supabase/admin";

export default async function RankingPage() {
  const participant = await requireParticipant();
  const supabase = createAdminClient();

  const { data: ranking, error } = await supabase
    .from("ranking")
    .select(
      `
        user_id,
        display_name,
        total_points,
        group_points,
        round_of_32_points,
        round_of_16_points,
        quarter_final_points,
        semi_final_points,
        third_place_points,
        final_points,
        predictions_count,
        scored_predictions_count,
        exact_score_count,
        result_hit_count
      `,
    )
    .order("total_points", { ascending: false })
    .order("exact_score_count", { ascending: false })
    .order("result_hit_count", { ascending: false })
    .order("predictions_count", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>Erro ao carregar ranking: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav isAdmin={participant.is_admin} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Ranking</h1>

          <p className="mt-2 text-slate-400">Classificação geral do bolão.</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Participante</th>
              <th className="px-4 py-3 text-right">Total</th>

              <th className="px-3 py-3 text-right">Grupos</th>
              <th className="px-3 py-3 text-right">32avos</th>
              <th className="px-3 py-3 text-right">Oitavas</th>
              <th className="px-3 py-3 text-right">Quartas</th>
              <th className="px-3 py-3 text-right">Semi</th>
              <th className="px-3 py-3 text-right">3º lugar</th>
              <th className="px-3 py-3 text-right">Final</th>

              <th className="px-4 py-3 text-right">Exatos</th>
              <th className="px-4 py-3 text-right">Resultados</th>
              <th className="px-4 py-3 text-right">Pontuados</th>
              <th className="px-4 py-3 text-right">Palpites</th>
            </tr>
          </thead>

          <tbody>
            {(ranking ?? []).map((row, index) => {
              const isCurrentUser = row.user_id === participant.id;

              return (
                <tr
                  key={row.user_id}
                  className={[
                    "border-b border-slate-800 last:border-b-0",
                    isCurrentUser ? "bg-emerald-500/10" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 font-semibold text-slate-400">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {row.display_name ?? "Participante"}
                    </div>

                    {isCurrentUser && (
                      <div className="text-xs text-emerald-300">Você</div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-lg font-bold text-emerald-300">
                    {row.total_points}
                  </td>

                  <td className="px-3 py-3 text-right">{row.group_points}</td>

                  <td className="px-3 py-3 text-right">
                    {row.round_of_32_points}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {row.round_of_16_points}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {row.quarter_final_points}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {row.semi_final_points}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {row.third_place_points}
                  </td>

                  <td className="px-3 py-3 text-right">{row.final_points}</td>

                  <td className="px-4 py-3 text-right">
                    {row.exact_score_count}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {row.result_hit_count}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {row.scored_predictions_count}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {row.predictions_count}
                  </td>
                </tr>
              );
            })}

            {ranking?.length === 0 && (
              <tr>
                <td
                  colSpan={14}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Nenhum participante no ranking ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
        <p>Regra de pontuação:</p>
        <p className="mt-1">
          Placar exato = 3 pontos. Acertou vencedor ou empate = 1 ponto. Errou =
          0 pontos.
        </p>
      </div>
    </main>
  );
}
