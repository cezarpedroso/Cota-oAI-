import { ChartNoAxesCombined } from "lucide-react";
import Link from "next/link";

export function BrandMark({
  tone = "dark",
  href = "/",
}: {
  tone?: "dark" | "light";
  href?: string;
}) {
  const text = tone === "light" ? "text-white" : "text-slate-950";
  const accent = tone === "light" ? "text-sky-300" : "text-blue-600";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 font-semibold tracking-[-0.03em] ${text}`}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-950/20">
        <ChartNoAxesCombined size={19} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="text-xl">
        Quote<span className={accent}>AI</span>
      </span>
    </Link>
  );
}
