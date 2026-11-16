"use client";
import Link from "next/link";
import { useState } from "react";
import {
  compareSuppliers,
  defaultWeights,
  weightsSchema,
  type ComparisonInput,
  type Issue,
} from "@/features/comparison/engine";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/lib/locale/types";

const issues: Record<Issue, [string, string]> = {
  missingItem: ["Unquoted requested item", "Item solicitado não cotado"],
  duplicateItem: ["Duplicate item association", "Associação de item duplicada"],
  quantity: [
    "Quantity differs or is unknown",
    "Quantidade diferente ou desconhecida",
  ],
  unit: ["Unit differs or is unknown", "Unidade diferente ou desconhecida"],
  price: ["Missing unit price", "Preço unitário ausente"],
  unknownItem: [
    "Unrecognized item association",
    "Associação de item desconhecida",
  ],
  charges: [
    "Freight, taxes or discount not provided",
    "Frete, impostos ou desconto não informado",
  ],
  currency: [
    "Currency unknown or different from RFQ",
    "Moeda desconhecida ou diferente da solicitação",
  ],
  delivery: ["Delivery days not provided", "Prazo não informado"],
  payment: [
    "Payment terms not provided",
    "Condições de pagamento não informadas",
  ],
  archived: ["Archived quotation", "Cotação arquivada"],
  overflow: [
    "Line total exceeds supported precision",
    "Total do item excede a precisão suportada",
  ],
  negativeTotal: [
    "Discount exceeds subtotal and charges",
    "Desconto excede subtotal e encargos",
  ],
};
export function SupplierComparison({
  data,
  rfqId,
  locale,
}: {
  data: ComparisonInput;
  rfqId: string;
  locale: Locale;
}) {
  const t = (en: string, pt: string) => (locale === "en" ? en : pt);
  const [weights, setWeights] = useState(defaultWeights);
  const [draft, setDraft] = useState(defaultWeights);
  const [invalid, setInvalid] = useState(false);
  const result = compareSuppliers(data, weights);
  const missing = t("Not provided", "Não informado");
  const summaryMoney = (value: string | null) =>
    formatMoney(value, data.currency, locale);
  const cells = result.offers.map((o) => {
    const money = (v: string | null) =>
      formatMoney(v, o.quote.currency, locale);
    return {
      offer: o,
      values: [
        ...o.rows.map((r) =>
          r.line
            ? `${r.line.quantity ?? missing} ${r.line.unit ?? missing} × ${money(r.line.unit_price)} = ${money(r.total)}`
            : t("Missing or duplicate line", "Item ausente ou duplicado"),
        ),
        money(o.subtotal),
        money(o.knownSubtotal),
        money(o.quote.freight_cost),
        money(o.quote.tax_amount),
        money(o.quote.discount_amount),
        money(o.total),
        o.quote.currency ?? missing,
        o.quote.delivery_days === null
          ? missing
          : `${o.quote.delivery_days} ${t("days", "dias")}`,
        o.quote.payment_terms?.trim() || missing,
        `${o.coverage}%`,
        o.complete
          ? t("Complete", "Completa")
          : t("Incomplete / ineligible", "Incompleta / inelegível"),
        o.issues.length
          ? o.issues.map((i) => issues[i][locale === "en" ? 0 : 1]).join("; ")
          : t("None", "Nenhuma"),
        `${t("Price", "Preço")}: ${o.breakdown.price}; ${t("Delivery", "Prazo")}: ${o.breakdown.delivery}; ${t("Completeness", "Completude")}: ${o.breakdown.completeness}`,
        o.score === null
          ? t("Not eligible", "Não elegível")
          : `${o.score} / 100`,
      ],
    };
  });
  const labels = [
    ...data.items.map((i) => `${i.description} — ${i.quantity} ${i.unit}`),
    t("Full item subtotal", "Subtotal dos itens"),
    t("Known subtotal (partial)", "Subtotal conhecido (parcial)"),
    t("Freight", "Frete"),
    t("Taxes", "Impostos"),
    t("Discount", "Desconto"),
    t("Final quoted total", "Total final cotado"),
    t("Currency", "Moeda"),
    t("Delivery", "Prazo"),
    t("Payment terms", "Pagamento"),
    t("Item coverage", "Cobertura de itens"),
    t("Completeness", "Completude"),
    t("Issues", "Pendências"),
    t("Score breakdown", "Detalhamento da pontuação"),
    t("Overall score", "Pontuação geral"),
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        {t(
          "Decision support only. Review commercial terms before purchasing. Each column is a quotation submission, not a verified unique supplier.",
          "Apenas apoio à decisão. Revise os termos antes de comprar. Cada coluna é uma cotação, não um fornecedor único verificado.",
        )}
      </p>
      <section
        aria-label={t("Comparison summary", "Resumo da comparação")}
        className="grid gap-3 sm:grid-cols-3"
      >
        {[
          [
            t("Quotation submissions", "Cotações recebidas"),
            String(data.quotes.length),
          ],
          [
            t("Complete / incomplete", "Completas / incompletas"),
            `${result.completeCount} / ${data.quotes.length - result.completeCount}`,
          ],
          [
            t("Comparable offers", "Ofertas comparáveis"),
            String(result.comparableCount),
          ],
          [
            t("Lowest comparable total", "Menor total comparável"),
            summaryMoney(result.lowest),
          ],
          [
            t("Highest comparable total", "Maior total comparável"),
            summaryMoney(result.highest),
          ],
          [
            t(
              "Price difference (not realized savings)",
              "Diferença de preço (não é economia realizada)",
            ),
            summaryMoney(result.difference),
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 break-words font-semibold">{value}</p>
          </div>
        ))}
      </section>
      {(result.comparableCount < 2 ||
        result.offers.some((o) => !o.complete)) && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4"
        >
          {t(
            "Fair price comparisons require at least two non-archived offers in the RFQ currency with identical requested quantities/units and known prices, freight, taxes and discounts. Unknown values are never zero. Missing payment or delivery terms prevent an overall recommendation.",
            "Uma comparação justa exige ao menos duas ofertas não arquivadas na moeda da solicitação, com quantidades/unidades iguais e preços, frete, impostos e descontos conhecidos. Valores desconhecidos nunca são zero. Termos de pagamento ou prazo ausentes impedem recomendação geral.",
          )}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = weightsSchema.safeParse(draft);
          setInvalid(!parsed.success);
          if (parsed.success) setWeights(parsed.data);
        }}
        className="rounded-lg border bg-white p-4"
      >
        <fieldset>
          <legend className="font-semibold">
            {t("Evaluation weights (%)", "Pesos de avaliação (%)")}
          </legend>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {(["price", "delivery", "completeness"] as const).map((key, i) => (
              <label key={key} className="text-sm">
                {t(
                  ["Price", "Delivery", "Completeness"][i],
                  ["Preço", "Prazo", "Completude"][i],
                )}
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  required
                  value={Number.isNaN(draft[key]) ? "" : draft[key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [key]:
                        e.target.value === "" ? NaN : Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-24 rounded border p-2"
                />
              </label>
            ))}
            <button className="rounded-lg bg-blue-700 px-4 py-2 text-white">
              {t("Apply weights", "Aplicar pesos")}
            </button>
          </div>
        </fieldset>
        {invalid && (
          <p role="alert" className="mt-2 text-red-700">
            {t(
              "Use whole percentages totaling 100. Previous weights remain active.",
              "Use percentuais inteiros somando 100. Os pesos anteriores continuam ativos.",
            )}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-600">
          {t("Active weights", "Pesos ativos")}: {weights.price} /{" "}
          {weights.delivery} / {weights.completeness}.{" "}
          {t(
            "Lower cost and delivery days score higher: 100 × (maximum − value) / (maximum − minimum); ties score 100. Missing delivery scores 0. Completeness counts fulfilled items and six known commercial fields. Weighted scores require complete, comparable offers; ties stay tied and use quotation ID for display order.",
            "Menor custo e prazo pontuam mais: 100 × (máximo − valor) / (máximo − mínimo); empates recebem 100. Prazo ausente recebe 0. Completude conta itens atendidos e seis campos comerciais conhecidos. Pontuação ponderada exige ofertas completas e comparáveis; empates usam o ID da cotação apenas para ordenar.",
          )}
        </p>
      </form>
      {data.quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p>
            {t(
              "No quotations yet. Add at least two offers to compare suppliers.",
              "Ainda não há cotações. Adicione ao menos duas ofertas para comparar.",
            )}
          </p>
          <Link
            className="mt-4 inline-block text-blue-700 underline"
            href={`/rfqs/${rfqId}/quotes/new`}
          >
            {t("Add supplier quotation", "Adicionar cotação")}
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
            <table className="w-full text-left text-sm">
              <caption className="p-4 text-left font-semibold">
                {t("Supplier comparison", "Comparação de fornecedores")}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="min-w-48 p-4">
                    {t("Requested scope / terms", "Escopo / condições")}
                  </th>
                  {cells.map(({ offer: o }) => (
                    <th scope="col" key={o.quote.id} className="min-w-64 p-4">
                      <Link
                        className="text-blue-700 underline"
                        href={`/rfqs/${rfqId}/quotes/${o.quote.id}`}
                      >
                        {o.quote.vendor_name}
                      </Link>
                      {o.lowest && (
                        <p className="mt-1 font-normal text-emerald-800">
                          {t(
                            "Lowest comparable cost",
                            "Menor custo comparável",
                          )}
                        </p>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, i) => (
                  <tr key={i} className="border-t even:bg-slate-50">
                    <th scope="row" className="p-4 font-medium">
                      {label}
                    </th>
                    {cells.map((c) => (
                      <td key={c.offer.quote.id} className="p-4 align-top">
                        {c.values[i]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-4 md:hidden">
            {cells.map(({ offer: o, values }) => (
              <article
                key={o.quote.id}
                className="rounded-lg border bg-white p-4"
              >
                <h2 className="text-lg font-semibold">
                  <Link
                    href={`/rfqs/${rfqId}/quotes/${o.quote.id}`}
                    className="text-blue-700 underline"
                  >
                    {o.quote.vendor_name}
                  </Link>
                </h2>
                {o.lowest && (
                  <p className="text-emerald-800">
                    {t("Lowest comparable cost", "Menor custo comparável")}
                  </p>
                )}
                <dl className="mt-3 divide-y">
                  {labels.map((label, i) => (
                    <div key={i} className="py-3">
                      <dt className="text-sm text-slate-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm">{values[i]}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
