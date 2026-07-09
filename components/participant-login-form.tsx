"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Participant = {
  id: string;
  display_name: string | null;
};

type ParticipantLoginFormProps = {
  participants: Participant[];
};

type SelectParticipantResponse = {
  ok?: boolean;
  error?: string;
};

export default function ParticipantLoginForm({
  participants,
}: ParticipantLoginFormProps) {
  const router = useRouter();

  const [participantId, setParticipantId] = useState(participants[0]?.id ?? "");

  const [isEntering, setIsEntering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsEntering(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/session/select-participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: participantId,
        }),
      });

      const data = (await response.json()) as SelectParticipantResponse;

      if (!response.ok) {
        setErrorMessage(data.error ?? `Erro HTTP ${response.status}`);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro inesperado ao entrar.",
      );
    } finally {
      setIsEntering(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Seu nome
        </label>

        <select
          value={participantId}
          disabled={isEntering}
          onChange={(event) => setParticipantId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-lg text-white outline-none focus:border-emerald-500 disabled:opacity-60"
        >
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.display_name ?? "Participante sem nome"}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isEntering || !participantId}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-lg font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {isEntering ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
