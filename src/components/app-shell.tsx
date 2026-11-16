import Link from "next/link";
import { ClipboardList, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { getCopy } from "@/lib/locale/copy";
import { getLocale } from "@/lib/locale/server";

export async function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const locale = await getLocale();
  const t = getCopy(locale).app;
  const nav = [
    { href: "/dashboard", label: t.overview, icon: LayoutDashboard },
    { href: "/rfqs", label: t.requests, icon: ClipboardList },
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
          {t.newRequest}
        </Link>
        <nav className="space-y-1" aria-label={t.mainNavigation}>
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
          <LanguageToggle locale={locale} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {t.account}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-700">
            {email}
          </p>
          <form action={logout}>
            <button className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
              <LogOut size={15} />
              {t.signOut}
            </button>
          </form>
        </div>
      </aside>
      <main className="lg:pl-[272px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <BrandMark href="/dashboard" />
            <LanguageToggle locale={locale} />
          </div>
          <Link
            href="/rfqs/new"
            className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm"
          >
            {t.newRequest}
          </Link>
        </header>
        <nav
          aria-label={locale === "en" ? "Mobile navigation" : "Navegação móvel"}
          className="flex flex-wrap items-center gap-4 border-b bg-white px-5 py-3 text-sm lg:hidden"
        >
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className="font-medium text-blue-700">
              {label}
            </Link>
          ))}
          <form action={logout} className="ml-auto">
            <button className="font-medium">{t.signOut}</button>
          </form>
        </nav>
        {children}
      </main>
    </div>
  );
}
