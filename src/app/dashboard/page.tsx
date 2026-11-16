import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
export const instant = false;
export default async function Dashboard() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [
    { count: rfqs },
    { count: drafts },
    { count: quotes },
    { data: recent },
  ] = await Promise.all([
    s.from("rfq_sessions").select("*", { count: "exact", head: true }),
    s
      .from("rfq_sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    s.from("vendor_quotes").select("*", { count: "exact", head: true }),
    s
      .from("rfq_sessions")
      .select("id,title,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const stats: { label: string; value: number | null; icon: LucideIcon }[] = [
    { label: "Solicitações", value: rfqs, icon: ClipboardList },
    { label: "Rascunhos", value: drafts, icon: FileText },
    { label: "Cotações", value: quotes, icon: ReceiptText },
  ];

  return (
    <AppShell email={user.email ?? ""}>
      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Visão geral
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Compras sob controle
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Acompanhe suas solicitações e cotações em um único lugar.
            </p>
          </div>
          <Link
            href="/rfqs/new"
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:block"
          >
            Nova solicitação
          </Link>
        </div>
        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={String(label)}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {value ?? 0}
              </p>
            </div>
          ))}
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Solicitações recentes</h2>
            <Link
              href="/rfqs"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Ver todas <ArrowRight size={15} />
            </Link>
          </div>
          {recent?.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {recent.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/rfqs/${x.id}`}
                    className="flex items-center justify-between gap-4 py-4 transition hover:text-blue-700"
                  >
                    <span className="font-medium">{x.title}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {x.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <p className="font-medium">
                Sua primeira solicitação começa aqui
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Adicione itens e receba cotações de fornecedores.
              </p>
              <Link
                href="/rfqs/new"
                className="mt-4 inline-block text-sm font-medium text-blue-600"
              >
                Criar solicitação
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
