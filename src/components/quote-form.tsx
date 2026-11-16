"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import type { z } from "zod";
import { createQuote } from "@/features/quotes/actions";
import { quoteSchema } from "@/features/quotes/schema";
import { extractQuotationAction } from "@/features/extraction/actions";
import type { Extraction } from "@/features/extraction/schema";

type Values = z.input<typeof quoteSchema>;
type RfqItem = { id: string; description: string; unit: string };

export function QuoteForm({
  rfqId,
  items,
}: {
  rfqId: string;
  items: RfqItem[];
}) {
  const [aiError, setAiError] = useState<string>();
  const [aiPreview, setAiPreview] = useState<Extraction>();
  const [extraction, setExtraction] = useState<Extraction>();
  const applyExtraction = () => {
    if (
      !extraction ||
      !window.confirm(
        "Aplicar as sugestões não verificadas da IA para revisão?",
      )
    )
      return;
    form.setValue(
      "vendorName",
      extraction.supplierName ?? form.getValues("vendorName"),
    );
    if (extraction.currency) form.setValue("currency", extraction.currency);
    form.setValue("freight", extraction.freight ?? "");
    form.setValue("tax", extraction.taxes ?? "");
    form.setValue("discount", extraction.discount ?? "");
    form.setValue("delivery", extraction.deliveryDays ?? "");
    form.setValue("paymentTerms", extraction.paymentTerms ?? "");
    lines.replace(
      extraction.items.map((line) => {
        const matches = items.filter(
          (item) =>
            item.description.trim().toLowerCase() ===
            line.description.trim().toLowerCase(),
        );
        return {
          rfqItemId: matches.length === 1 ? matches[0].id : "",
          description: line.description,
          quantity: line.quantity ?? "",
          unitPrice: line.unitPrice ?? "",
          unit: line.unit ?? "",
          lineTotal: "",
        };
      }),
    );
  };
  const form = useForm<Values>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      currency: "BRL",
      freight: "",
      tax: "",
      discount: "",
      delivery: "",
      paymentTerms: "",
      rawText: "",
      items: [
        {
          rfqItemId: items[0]?.id ?? "",
          description: "",
          quantity: 1,
          unitPrice: "",
          unit: items[0]?.unit ?? "",
          lineTotal: "",
        },
      ],
    },
  });
  const lines = useFieldArray({ control: form.control, name: "items" });
  const submit = form.handleSubmit((values) => {
    document.querySelector<HTMLInputElement>("#quote-payload")!.value =
      JSON.stringify(values);
  });

  return (
    <form
      action={createQuote}
      onSubmit={submit}
      className="mx-auto max-w-3xl space-y-5 p-6"
    >
      <input name="rfqId" type="hidden" value={rfqId} />
      <input id="quote-payload" name="payload" type="hidden" />
      <h1 className="text-2xl font-semibold">Nova cotação</h1>
      <input
        {...form.register("vendorName")}
        className="w-full border p-2"
        placeholder="Fornecedor"
      />
      {form.formState.errors.vendorName && (
        <p className="text-sm text-red-700">
          {form.formState.errors.vendorName.message}
        </p>
      )}
      <textarea
        {...form.register("rawText")}
        className="w-full border p-2"
        placeholder="Texto original da cotação"
      />
      <button
        type="button"
        className="rounded border px-3 py-2"
        onClick={async () => {
          try {
            setAiError(undefined);
            const result = await extractQuotationAction(
              rfqId,
              form.getValues("rawText") ?? "",
            );
            setExtraction(result);
            setAiPreview(result);
          } catch {
            setAiError(
              "Não foi possível extrair os dados. Revise o texto e tente novamente.",
            );
          }
        }}
      >
        Extrair com IA
      </button>
      {aiError && <p className="text-sm text-red-700">{aiError}</p>}
      {aiPreview && (
        <section className="rounded border border-amber-300 bg-amber-50 p-3">
          <p className="font-medium">
            Dados extraídos pela IA — revise antes de salvar. Confirme cada
            associação com um item solicitado.
          </p>
          <button
            className="mt-2 rounded border px-3 py-1"
            type="button"
            onClick={applyExtraction}
          >
            Aplicar sugestões para revisão
          </button>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Fornecedor</dt>
              <dd>{aiPreview.supplierName ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Moeda</dt>
              <dd>{aiPreview.currency ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Itens encontrados</dt>
              <dd>{aiPreview.items.length}</dd>
            </div>
          </dl>
        </section>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <select {...form.register("currency")} className="border p-2">
          <option value="BRL">BRL</option>
          <option value="USD">USD</option>
        </select>
        <input
          {...form.register("freight")}
          className="border p-2"
          placeholder="Frete (opcional)"
        />
        <input
          {...form.register("tax")}
          className="border p-2"
          placeholder="Impostos (opcional)"
        />
        <input
          {...form.register("discount")}
          className="border p-2"
          placeholder="Desconto (opcional)"
        />
        <input
          {...form.register("delivery")}
          className="border p-2"
          placeholder="Prazo em dias"
        />
        <input
          {...form.register("paymentTerms")}
          className="border p-2"
          placeholder="Condições de pagamento"
        />
      </div>
      {lines.fields.map((line, index) => (
        <fieldset className="rounded border p-3" key={line.id}>
          <legend>Item {index + 1}</legend>
          <div className="grid gap-2 sm:grid-cols-4">
            <select
              {...form.register(`items.${index}.rfqItemId`)}
              className="border p-2"
            >
              <option value="">Selecione o item solicitado</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.description}
                </option>
              ))}
            </select>
            <input
              {...form.register(`items.${index}.quantity`)}
              className="border p-2"
              type="number"
              step="0.0001"
              placeholder="Quantidade"
            />
            <input
              {...form.register(`items.${index}.unitPrice`)}
              className="border p-2"
              placeholder="Preço unitário"
            />
            <input
              {...form.register(`items.${index}.unit`)}
              className="border p-2"
              placeholder="Unidade"
            />
          </div>
          <button
            className="mt-2 text-sm text-red-700"
            disabled={lines.fields.length === 1}
            onClick={() => lines.remove(index)}
            type="button"
          >
            Remover item
          </button>
        </fieldset>
      ))}
      <button
        className="rounded border px-3 py-2"
        onClick={() =>
          lines.append({
            rfqItemId: items[0]?.id ?? "",
            description: "",
            quantity: 1,
            unitPrice: "",
            unit: items[0]?.unit ?? "",
            lineTotal: "",
          })
        }
        type="button"
      >
        Adicionar item
      </button>
      <button
        className="block rounded bg-emerald-700 px-4 py-2 text-white"
        disabled={form.formState.isSubmitting}
      >
        Salvar cotação
      </button>
    </form>
  );
}
