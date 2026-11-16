import { RfqForm } from "@/components/rfq-form";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getCopy } from "@/lib/locale/copy";
import { getLocale } from "@/lib/locale/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const instant = false;

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const t = getCopy(locale).newRfq;

  return (
    <AppShell email={user.email ?? ""}>
      <main className="mx-auto max-w-6xl p-5 sm:p-8">
        <Link
          href="/rfqs"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {getCopy(locale).app.requests}
        </Link>
        <header className="mt-5 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {t.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t.description}
          </p>
        </header>
        <div className="mt-8">
          <RfqForm locale={locale} />
        </div>
      </main>
    </AppShell>
  );
}
