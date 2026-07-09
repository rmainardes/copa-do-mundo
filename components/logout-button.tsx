"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function handleLogout() {
    setIsLeaving(true);

    try {
      await fetch("/api/session/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLeaving}
      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-60"
    >
      {isLeaving ? "Saindo..." : "Trocar participante"}
    </button>
  );
}
