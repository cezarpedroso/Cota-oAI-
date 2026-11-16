import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getCopy } from "@/lib/locale/copy";
import { getLocale } from "@/lib/locale/server";
export const instant = false;
export default async function Rfqs() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const locale = await getLocale();
  const t = getCopy(locale).rfqs;
  const { data } = await s
    .from("rfq_sessions")
    .select(
      "id,title,status,currency,created_at,rfq_items(count),vendor_quotes(count)",
    )
    .order("created_at", { ascending: false });
  return (
    <AppShell email={user.email ?? ""}>
      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {t.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t.description}
            </p>
          </div>
          <Link
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            href="/rfqs/new"
          >
            {getCopy(locale).app.newRequest}
          </Link>
        </div>
        {data?.length ? (
          <ul className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {data.map((r) => (
              <li
                className="border-b border-slate-100 last:border-0"
                key={r.id}
              >
                <Link
                  className="flex items-center justify-between gap-5 p-5 transition hover:bg-slate-50"
                  href={`/rfqs/${r.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-900">
                        {r.title}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {t.createdOn}{" "}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(r.created_at))}{" "}
                      · {r.currency}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-5 text-sm text-slate-500 sm:flex">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={16} /> {r.rfq_items[0]?.count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ReceiptText size={16} /> {r.vendor_quotes[0]?.count ?? 0}
                    </span>
                    <ArrowRight size={17} className="text-slate-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium">{t.emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{t.emptyDescription}</p>
            <Link
              href="/rfqs/new"
              className="mt-4 inline-block text-sm font-medium text-blue-600"
            >
              {t.createRequest}
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
