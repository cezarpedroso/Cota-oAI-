"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { createQuote } from "@/features/quotes/actions";
import { quoteSchema } from "@/features/quotes/schema";
import { extractQuotationAction } from "@/features/extraction/actions";
import type { Extraction } from "@/features/extraction/schema";
import { lineTotal, optionalDecimal, positiveDecimal } from "@/lib/money";

type Values = z.input<typeof quoteSchema>;
type RfqItem = { id: string; description: string; unit: string };
export function QuoteForm({
  rfqId,
  items,
  locale = "pt-BR",
}: {
  rfqId: string;
  items: RfqItem[];
  locale?: string;
}) {
  const router = useRouter();
  const t = (en: string, pt: string) => (locale === "en" ? en : pt);
  const [failure, setFailure] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [preview, setPreview] = useState<Extraction>();
  const blankLine = () => ({
    rfqItemId: "",
    description: "",
    quantity: "",
    unitPrice: "",
    unit: "",
  });
  const form = useForm<Values, unknown, z.output<typeof quoteSchema>>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      vendorName: "",
      rawText: "",
      currency: "",
      freight: "",
      tax: "",
      discount: "",
      delivery: "",
      paymentTerms: "",
      items: [blankLine()],
    },
  });
  const lines = useFieldArray({ control: form.control, name: "items" });
  const watched = useWatch({ control: form.control, name: "items" });
  const submit = form.handleSubmit(async (values) => {
    setFailure("");
    try {
      const result = await createQuote(rfqId, values);
      if (result.error !== null) {
        setFailure(
          t(
            "Unable to save. Check your fields and sign-in session, then retry.",
            "Não foi possível salvar. Confira os campos e sua sessão e tente novamente.",
          ),
        );
        return;
      }
      router.push(result.href);
      router.refresh();
    } catch {
      setFailure(
        t(
          "Unable to save. Please retry.",
          "Não foi possível salvar. Tente novamente.",
        ),
      );
    }
  });
  const error = (message?: string) =>
    message ? (
      <p role="alert" className="text-sm text-red-700">
        {message}
      </p>
    ) : null;
  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5";
  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8"
    >
      <h1 className="text-2xl font-semibold">
        {t("New supplier quotation", "Nova cotação")}
      </h1>
      <label className="block">
        {t("Supplier name", "Fornecedor")}
        <input className={fieldClass} {...form.register("vendorName")} />
        {error(form.formState.errors.vendorName?.message)}
      </label>
      <label className="block">
        {t("Original quotation text", "Texto original")}
        <textarea
          rows={5}
          className={fieldClass}
          {...form.register("rawText")}
        />
        {error(form.formState.errors.rawText?.message)}
      </label>
      <button
        type="button"
        disabled={extracting || form.formState.isSubmitting}
        className="rounded-lg border px-4 py-2 disabled:opacity-50"
        onClick={async () => {
          setExtracting(true);
          setFailure("");
          setPreview(undefined);
          try {
            const result = await extractQuotationAction(
              rfqId,
              form.getValues("rawText") || "",
            );
            if (result.data) setPreview(result.data);
            else
              setFailure(
                result.error ||
                  t("Extraction unavailable.", "Extração indisponível."),
              );
          } catch {
            setFailure(t("Extraction unavailable.", "Extração indisponível."));
          } finally {
            setExtracting(false);
          }
        }}
      >
        {extracting
          ? t("Extracting…", "Extraindo…")
          : t("Extract with AI", "Extrair com IA")}
      </button>
      {preview && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p>
            {t(
              "Unverified AI suggestions. Applying replaces the current fields and lines. Review every item association before saving.",
              "Sugestões não verificadas. Aplicar substitui os campos e itens atuais. Revise cada associação antes de salvar.",
            )}
          </p>
          <p className="my-2">
            {preview.supplierName ?? t("Not provided", "Não informado")} ·{" "}
            {preview.items.length} {t("lines", "itens")}
          </p>
          <button
            type="button"
            className="rounded border px-3 py-2"
            onClick={() => {
              if (
                !window.confirm(
                  t(
                    "Replace your current fields and lines with these suggestions?",
                    "Substituir os campos e itens atuais por estas sugestões?",
                  ),
                )
              )
                return;
              form.setValue("vendorName", preview.supplierName ?? "");
              form.setValue("currency", preview.currency ?? "");
              form.setValue("freight", preview.freight ?? "");
              form.setValue("tax", preview.taxes ?? "");
              form.setValue("discount", preview.discount ?? "");
              form.setValue("delivery", preview.deliveryDays ?? "");
              form.setValue("paymentTerms", preview.paymentTerms ?? "");
              // All associations require an explicit user selection.
              lines.replace(
                preview.items.length
                  ? preview.items.map((i) => ({
                      rfqItemId: "",
                      description: i.description,
                      quantity: i.quantity ?? "",
                      unitPrice: i.unitPrice ?? "",
                      unit: i.unit ?? "",
                    }))
                  : [blankLine()],
              );
            }}
          >
            {t("Apply for review", "Aplicar para revisão")}
          </button>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          {t("Currency", "Moeda")}
          <select className={fieldClass} {...form.register("currency")}>
            <option value="">{t("Not provided", "Não informado")}</option>
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
          </select>
          {error(form.formState.errors.currency?.message)}
        </label>
        {(
          ["freight", "tax", "discount", "delivery", "paymentTerms"] as const
        ).map((name, i) => (
          <label key={name}>
            {t(
              [
                "Freight",
                "Taxes",
                "Discount",
                "Delivery days",
                "Payment terms",
              ][i],
              [
                "Frete",
                "Impostos",
                "Desconto",
                "Prazo em dias",
                "Condições de pagamento",
              ][i],
            )}
            <input className={fieldClass} {...form.register(name)} />
            {error(form.formState.errors[name]?.message)}
          </label>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {t(
          "Leave unknown amounts blank. Use a decimal point and up to four decimal places.",
          "Deixe valores desconhecidos em branco. Use ponto decimal e até quatro casas.",
        )}
      </p>
      {lines.fields.map((line, index) => {
        const row = watched?.[index];
        const q = positiveDecimal.safeParse(row?.quantity);
        const p = optionalDecimal.safeParse(row?.unitPrice);
        let total: string | null = null;
        if (q.success && p.success) {
          try {
            total = lineTotal(q.data, p.data);
          } catch {
            /* Resolver reports overflow. */
          }
        }
        const errors = form.formState.errors.items?.[index];
        return (
          <fieldset key={line.id} className="space-y-3 rounded-lg border p-4">
            <legend className="font-semibold">
              {t("Line", "Item")} {index + 1}
            </legend>
            <label className="block">
              {t("Requested item", "Item solicitado")}
              <select
                className={fieldClass}
                {...form.register(`items.${index}.rfqItemId`)}
              >
                <option value="">
                  {t("Select an item", "Selecione um item")}
                </option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.description} ({i.unit})
                  </option>
                ))}
              </select>
              {error(errors?.rfqItemId?.message)}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["description", "quantity", "unitPrice", "unit"] as const).map(
                (name, i) => (
                  <label key={name}>
                    {t(
                      ["Description", "Quantity", "Unit price", "Unit"][i],
                      ["Descrição", "Quantidade", "Preço unitário", "Unidade"][
                        i
                      ],
                    )}
                    <input
                      className={fieldClass}
                      {...form.register(`items.${index}.${name}`)}
                    />
                    {error(errors?.[name]?.message)}
                  </label>
                ),
              )}
            </div>
            <p>
              {t("Calculated line total", "Total calculado")}:{" "}
              {total ?? t("Not provided", "Não informado")}
            </p>
            {error(errors?.root?.message)}
            <button
              type="button"
              disabled={lines.fields.length === 1}
              className="text-sm text-red-700 disabled:opacity-40"
              onClick={() => lines.remove(index)}
            >
              {t("Remove line", "Remover item")}
            </button>
          </fieldset>
        );
      })}
      {error(
        form.formState.errors.items?.message ||
          form.formState.errors.items?.root?.message,
      )}
      <button
        type="button"
        className="rounded-lg border px-4 py-2"
        disabled={lines.fields.length >= 200}
        onClick={() => lines.append(blankLine())}
      >
        {t("Add line", "Adicionar item")}
      </button>
      {failure && (
        <p role="alert" className="text-red-700">
          {failure}
        </p>
      )}
      <button
        type="submit"
        disabled={form.formState.isSubmitting || extracting}
        className="block rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {form.formState.isSubmitting
          ? t("Saving…", "Salvando…")
          : t("Save quotation", "Salvar cotação")}
      </button>
    </form>
  );
}
