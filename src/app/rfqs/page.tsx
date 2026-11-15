import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const instant = false;
export default async function Rfqs() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await s
    .from("rfq_sessions")
    .select(
      "id,title,status,currency,created_at,rfq_items(count),vendor_quotes(count)",
    )
    .order("created_at", { ascending: false });
  return (
    <main className="p-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Solicitações</h1>
        <Link
          className="rounded bg-emerald-700 px-4 py-2 text-white"
          href="/rfqs/new"
        >
          Nova RFQ
        </Link>
      </div>
      {data?.length ? (
        <ul className="mt-6 space-y-3">
          {data.map((r) => (
            <li className="rounded bg-white p-4 shadow" key={r.id}>
              <Link href={`/rfqs/${r.id}`}>{r.title}</Link>
              <span className="ml-3 text-sm text-slate-500">
                {r.status} · {r.currency}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-slate-600">Nenhuma solicitação criada.</p>
      )}
    </main>
  );
}
