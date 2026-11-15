"use server";
import { createClient } from "@/lib/supabase/server";
import { rfqSchema } from "./schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
export async function createRfq(form: FormData) {
  const raw = JSON.parse(String(form.get("payload") || "{}"));
  const p = rfqSchema.safeParse(raw);
  if (!p.success) throw new Error("Dados da solicitação inválidos.");
  const s = await createClient();
  if (!(await s.auth.getUser()).data.user) redirect("/login");
  const { data, error } = await s.rpc("create_rfq_atomic", {
    p_title: p.data.title,
    p_description: p.data.description || "",
    p_currency: p.data.currency,
    p_items: p.data.items,
  });
  if (error || !data) throw new Error("Não foi possível criar a solicitação.");
  redirect(`/rfqs/${data}`);
}
export async function deleteRfq(form: FormData) {
  const id = String(form.get("id") || "");
  const s = await createClient();
  if (!(await s.auth.getUser()).data.user) redirect("/login");
  const { data, error } = await s
    .from("rfq_sessions")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || data.length !== 1)
    throw new Error("RFQ não encontrada ou sem permissão para excluir.");
  revalidatePath("/rfqs");
  revalidatePath("/dashboard");
  redirect("/rfqs");
}
export async function updateRfq(form: FormData) {
  const id = String(form.get("id") || "");
  const p = rfqSchema
    .pick({ title: true, description: true, currency: true })
    .safeParse(Object.fromEntries(form));
  if (!p.success) throw new Error("Dados inválidos.");
  const s = await createClient();
  if (!(await s.auth.getUser()).data.user) redirect("/login");
  const { data, error } = await s
    .from("rfq_sessions")
    .update({
      title: p.data.title,
      description: p.data.description || null,
      currency: p.data.currency,
    })
    .eq("id", id)
    .select("id");
  if (error || data.length !== 1)
    throw new Error("RFQ não encontrada ou sem permissão para editar.");
  revalidatePath(`/rfqs/${id}`);
  redirect(`/rfqs/${id}`);
}
