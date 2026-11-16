import { CheckCircle2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { getCopy } from "@/lib/locale/copy";
import type { Locale } from "@/lib/locale/types";

export function AuthLayout({
  title,
  description,
  children,
  locale,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  locale: Locale;
}) {
  const t = getCopy(locale).auth;
  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_80px_-36px_rgba(15,23,42,0.42)] lg:min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(500px,1.08fr)]">
        <section className="flex min-h-full flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <LanguageToggle locale={locale} />
          </div>
          <div className="my-auto max-w-md py-12 lg:py-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              {t.operations}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {description}
            </p>
            <div className="mt-9">{children}</div>
          </div>
          <p className="text-xs leading-5 text-slate-500">{t.secureSpace}</p>
        </section>

        <aside className="relative hidden overflow-hidden bg-slate-950 lg:block">
          <Image
            src="/images/auth-wallpaper.avif"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 0px"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,23,48,0.94),rgba(11,37,79,0.63),rgba(15,23,42,0.85))]" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
            <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
              <ShieldCheck size={18} aria-hidden="true" />
              {t.secureSpace}
            </div>
            <div className="max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                {t.control}
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.045em]">
                {t.sideTitle}
              </h2>
              <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-100">
                {t.sidePoints.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-sky-300"
                      size={18}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
