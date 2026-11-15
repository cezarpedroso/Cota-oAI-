import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
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
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white p-5">
        <b className="text-emerald-700">COTAÇÃOAI</b>
        <form action={logout}>
          <button className="text-sm">Sair</button>
        </form>
      </header>
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="my-6 grid gap-4 sm:grid-cols-3">
          {[
            ["RFQs", rfqs],
            ["Rascunhos", drafts],
            ["Cotações", quotes],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-slate-500">{l}</p>
              <p className="text-3xl font-semibold">{v ?? 0}</p>
            </div>
          ))}
        </div>
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Solicitações recentes</h2>
          {recent?.length ? (
            <ul>
              {recent.map((x) => (
                <li key={x.id} className="border-b py-3">
                  {x.title} <span className="text-slate-500">{x.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-slate-600">
              Ainda não há solicitações de compra.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
