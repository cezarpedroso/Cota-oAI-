import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { updateRfq } from "@/features/rfqs/actions";
import { getCopy } from "@/lib/locale/copy";
import { getLocale } from "@/lib/locale/server";
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
  const t = getCopy(await getLocale()).editRfq;
  return (
    <form action={updateRfq} className="mx-auto max-w-xl space-y-4 p-6">
      <input type="hidden" name="id" value={id} />
      <h1 className="text-2xl font-semibold">{t.title}</h1>
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
        aria-label={t.description}
      />
      <label className="block text-sm font-medium">
        {t.currency}
        <select
          name="currency"
          defaultValue={data.currency}
          className="mt-1 block border p-2"
        >
          <option>BRL</option>
          <option>USD</option>
        </select>
      </label>
      <button className="block rounded bg-emerald-700 px-4 py-2 text-white">
        {t.save}
      </button>
    </form>
  );
}
