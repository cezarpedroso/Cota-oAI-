"use client";

import { FileText, ListChecks, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createRfq } from "@/features/rfqs/actions";
import { getCopy } from "@/lib/locale/copy";
import type { Locale } from "@/lib/locale/types";

type RequestedItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
};

const createItem = (id: string, unit: string): RequestedItem => ({
  id,
  description: "",
  quantity: 1,
  unit,
  specifications: "",
});

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/15 transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function RfqForm({ locale }: { locale: Locale }) {
  const t = getCopy(locale).newRfq;
  const defaultUnit = locale === "en" ? "ea." : "un.";
  const payloadRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [items, setItems] = useState<RequestedItem[]>(() => [
    createItem("item-0", defaultUnit),
  ]);

  const updateItem = (index: number, patch: Partial<RequestedItem>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      createItem(`item-${Date.now()}-${current.length}`, defaultUnit),
    ]);
  };

  const countLabel =
    items.length === 1 ? t.itemCountSingular : t.itemCountPlural;

  return (
    <form
      action={createRfq}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const description = String(new FormData(form).get("description") || "");

        if (payloadRef.current) {
          payloadRef.current.value = JSON.stringify({
            title,
            description,
            currency,
            items: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              specifications: item.specifications,
            })),
          });
        }
      }}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start"
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                1
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {t.requestDetails}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {t.requestDetailsDescription}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-6">
            <label className="block sm:col-span-2">
              <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                {t.titleLabel}
                <span className="text-xs font-medium text-slate-400">
                  {t.required}
                </span>
              </span>
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                value={title}
                placeholder={t.titlePlaceholder}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-800">
                {t.descriptionLabel}
              </span>
              <textarea
                name="description"
                rows={4}
                maxLength={4000}
                placeholder={t.descriptionPlaceholder}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">
                {t.currencyLabel}
              </span>
              <select
                name="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              >
                <option value="BRL">{t.currencyBrl}</option>
                <option value="USD">{t.currencyUsd}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                2
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">{t.items}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {t.itemsDescription}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {items.length} {countLabel}
            </span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {items.map((item, index) => (
              <fieldset
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
                key={item.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <legend className="text-sm font-semibold text-slate-800">
                    {t.item} {index + 1}
                  </legend>
                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                    {t.removeItem}
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_132px_132px]">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {t.descriptionItemLabel}
                    </span>
                    <input
                      required
                      value={item.description}
                      placeholder={t.descriptionItemPlaceholder}
                      onChange={(event) =>
                        updateItem(index, { description: event.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {t.quantityLabel}
                    </span>
                    <input
                      required
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      {t.unitLabel}
                    </span>
                    <input
                      required
                      value={item.unit}
                      placeholder={t.unitPlaceholder}
                      onChange={(event) =>
                        updateItem(index, { unit: event.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {t.specificationsLabel}
                  </span>
                  <textarea
                    rows={2}
                    value={item.specifications}
                    placeholder={t.specificationsPlaceholder}
                    onChange={(event) =>
                      updateItem(index, { specifications: event.target.value })
                    }
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                  />
                </label>
              </fieldset>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <Plus size={16} />
              {t.addItem}
            </button>
          </div>
        </section>

        <input ref={payloadRef} type="hidden" name="payload" />
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <Link
            href="/rfqs"
            className="inline-flex justify-center rounded-lg px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            {t.cancel}
          </Link>
          <SubmitButton label={t.save} pendingLabel={t.saving} />
        </div>
      </div>

      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <div className="flex items-center gap-2 text-slate-900">
          <FileText size={18} className="text-blue-700" />
          <h2 className="font-semibold">{t.requestSummary}</h2>
        </div>
        <p className="mt-4 truncate text-base font-semibold text-slate-900">
          {title.trim() || t.untitledRequest}
        </p>
        <dl className="mt-5 space-y-3 border-y border-slate-100 py-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">{t.currencyLabel}</dt>
            <dd className="font-semibold text-slate-800">{currency}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="inline-flex items-center gap-1.5 text-slate-500">
              <ListChecks size={15} /> {t.items}
            </dt>
            <dd className="font-semibold text-slate-800">{items.length}</dd>
          </div>
        </dl>
        <ol className="mt-5 space-y-3 text-sm text-slate-600">
          {[t.stepContext, t.stepItems, t.stepReview].map((step, index) => (
            <li key={step} className="flex items-center gap-2.5">
              <span className="grid size-5 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">
          {t.requestSummaryHint}
        </p>
      </aside>
    </form>
  );
}
