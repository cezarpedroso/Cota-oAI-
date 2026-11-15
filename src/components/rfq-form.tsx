"use client";
import { useState } from "react";
import { createRfq } from "@/features/rfqs/actions";
export function RfqForm() {
  const [items, setItems] = useState([
    { description: "", quantity: 1, unit: "un", specifications: "" },
  ]);
  return (
    <form
      action={createRfq}
      onSubmit={(e) => {
        const f = e.currentTarget;
        const g = (n: string) => String(new FormData(f).get(n) || "");
        const p = f.querySelector<HTMLInputElement>("[name=payload]")!;
        p.value = JSON.stringify({
          title: g("title"),
          description: g("description"),
          currency: g("currency"),
          items,
        });
      }}
      className="space-y-4"
    >
      <input
        name="title"
        placeholder="Título"
        required
        className="w-full border p-2"
      />
      <textarea
        name="description"
        placeholder="Descrição"
        className="w-full border p-2"
      />
      <select name="currency" className="border p-2">
        <option>BRL</option>
        <option>USD</option>
      </select>
      {items.map((x, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder="Item"
            value={x.description}
            onChange={(e) =>
              setItems(
                items.map((a, n) =>
                  n === i ? { ...a, description: e.target.value } : a,
                ),
              )
            }
          />
          <input
            type="number"
            min="0.0001"
            value={x.quantity}
            onChange={(e) =>
              setItems(
                items.map((a, n) =>
                  n === i ? { ...a, quantity: +e.target.value } : a,
                ),
              )
            }
          />
          <input
            value={x.unit}
            onChange={(e) =>
              setItems(
                items.map((a, n) =>
                  n === i ? { ...a, unit: e.target.value } : a,
                ),
              )
            }
          />
        </div>
      ))}
      <input type="hidden" name="payload" />
      <button
        type="button"
        onClick={() =>
          setItems([
            ...items,
            { description: "", quantity: 1, unit: "un", specifications: "" },
          ])
        }
      >
        Adicionar item
      </button>
      <button className="block rounded bg-emerald-700 px-4 py-2 text-white">
        Salvar RFQ
      </button>
    </form>
  );
}
