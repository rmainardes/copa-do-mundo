import Link from "next/link";
import LogoutButton from "./logout-button";

type AppNavProps = {
  isAdmin?: boolean;
};

export default function AppNav({ isAdmin = false }: AppNavProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/dashboard" className="text-xl font-bold">
            Bolão da Copa
          </Link>

          <p className="mt-1 text-sm text-slate-500">Palpites da família</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            Página inicial
          </Link>

          <Link
            href="/matches"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            Jogos
          </Link>

          <Link
            href="/ranking"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            Ranking
          </Link>

          {isAdmin && (
            <Link
              href="/admin/import"
              className="rounded-lg border border-emerald-500 px-3 py-2 text-sm text-emerald-300 hover:bg-slate-900"
            >
              Administrador
            </Link>
          )}

          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
