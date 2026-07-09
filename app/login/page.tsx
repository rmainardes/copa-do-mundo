import { redirect } from "next/navigation";
import { createAdminClient } from "../../lib/supabase/admin";
import { getCurrentParticipant } from "../../lib/current-participant";
import ParticipantLoginForm from "@/components/participant-login-form";

export default async function LoginPage() {
  const currentParticipant = await getCurrentParticipant();

  if (currentParticipant) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  const { data: participants, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p>Erro ao carregar participantes: {error.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-bold">Bolão da Copa</h1>

        <p className="mt-3 text-slate-400">Escolha seu nome para entrar.</p>

        <div className="mt-6">
          <ParticipantLoginForm participants={participants ?? []} />
        </div>
      </div>
    </main>
  );
}
