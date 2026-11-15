import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { QuoteForm } from "@/components/quote-form";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await createClient();
  if (!(await s.auth.getUser()).data.user) redirect("/login");
  const { id } = await params;
  const { data: items } = await s
    .from("rfq_items")
    .select("id,description,unit")
    .eq("rfq_id", id);
  if (!items?.length) notFound();
  return <QuoteForm rfqId={id} items={items} />;
}
