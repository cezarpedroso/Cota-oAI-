import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await createClient();
  if (!(await s.auth.getUser()).data.user) redirect("/login");
  const { id } = await params;
  const { data } = await s
    .from("rfq_sessions")
    .select("*,rfq_items(*),vendor_quotes(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">{data.title}</h1><Link className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white" href={`/rfqs/${id}/quotes/new`}>Add Supplier Quotation</Link></div>
      <p className="text-slate-600">
        {data.status} · {data.currency}
      </p>
      <h2 className="mt-8 font-semibold">Itens solicitados</h2>
      <ul>
        {data.rfq_items.map(
          (x: {
            id: string;
            description: string;
            quantity: number;
            unit: string;
          }) => (
            <li key={x.id}>
              {x.description}: {x.quantity} {x.unit}
            </li>
          ),
        )}
      </ul>
      <h2 className="mt-8 font-semibold">Cotações</h2>
      <p>
        {data.vendor_quotes.length
          ? `${data.vendor_quotes.length} cotação(ões)`
          : "Nenhuma cotação."}
      </p>
    </main>
  );
}
