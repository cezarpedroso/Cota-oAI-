import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { updateRfq } from "@/features/rfqs/actions";
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
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return (
    <form action={updateRfq} className="mx-auto max-w-xl space-y-4 p-6">
      <input type="hidden" name="id" value={id} />
      <input
        name="title"
        defaultValue={data.title}
        className="w-full border p-2"
        required
      />
      <textarea
        name="description"
        defaultValue={data.description ?? ""}
        className="w-full border p-2"
      />
      <select name="currency" defaultValue={data.currency}>
        <option>BRL</option>
        <option>USD</option>
      </select>
      <button className="block rounded bg-emerald-700 px-4 py-2 text-white">
        Salvar
      </button>
    </form>
  );
}
