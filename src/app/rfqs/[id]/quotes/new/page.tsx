import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { QuoteForm } from "@/components/quote-form";
import { getLocale } from "@/lib/locale/server";
import { AppShell } from "@/components/app-shell";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { data: items } = await s
    .from("rfq_items")
    .select("id,description,unit")
    .eq("rfq_id", id);
  if (!items?.length) notFound();
  return (
    <AppShell email={user.email ?? ""}>
      <QuoteForm rfqId={id} items={items} locale={await getLocale()} />
    </AppShell>
  );
}
