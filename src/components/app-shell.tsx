import Link from "next/link";
import { ClipboardList, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { BrandMark } from "@/components/brand-mark";

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const nav = [
    { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
    { href: "/rfqs", label: "Solicitações", icon: ClipboardList },
  ];
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <aside className="fixed inset-y-0 hidden w-[272px] flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <BrandMark href="/dashboard" />
        <Link
          href="/rfqs/new"
          className="mb-8 mt-10 flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/15 transition hover:bg-blue-800"
        >
          <Plus size={16} />
          Nova solicitação
        </Link>
        <nav className="space-y-1" aria-label="Navegação principal">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Conta
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-700">
            {email}
          </p>
          <form action={logout}>
            <button className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
              <LogOut size={15} />
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="lg:pl-[272px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:hidden">
          <BrandMark href="/dashboard" />
          <Link
            href="/rfqs/new"
            className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Nova RFQ
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}
