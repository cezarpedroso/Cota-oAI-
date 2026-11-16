"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/features/locale/actions";
import type { Locale } from "@/lib/locale/types";

export function LanguageToggle({
  locale,
  tone = "light",
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextLocale: Locale = locale === "pt-BR" ? "en" : "pt-BR";
  const label =
    locale === "pt-BR" ? "Switch to English" : "Mudar para português";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocale(nextLocale);
          router.refresh();
        })
      }
      className={
        tone === "dark"
          ? "inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
          : "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      }
    >
      <Languages size={13} aria-hidden="true" />
      {pending ? "…" : locale === "pt-BR" ? "EN" : "PT"}
    </button>
  );
}
