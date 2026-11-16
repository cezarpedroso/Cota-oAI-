import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/homepage-wallpaper.avif"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(4,15,35,0.98)_2%,rgba(8,29,60,0.92)_50%,rgba(12,32,62,0.72))]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 sm:px-10">
        <header className="flex items-center justify-between py-7 sm:py-9">
          <BrandMark tone="light" />
          <Link
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            href="/login"
          >
            Entrar
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Procurement intelligence
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl">
              Controle de compras, da solicitação à decisão.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Organize RFQs, reúna cotações e conduza decisões com uma visão
              financeira mais clara do seu processo de compras.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition hover:bg-slate-100"
                href="/signup"
              >
                Criar espaço de trabalho
                <ArrowRight size={17} />
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                href="/login"
              >
                Acessar plataforma
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: ClipboardCheck,
                title: "Solicitações estruturadas",
                description: "Itens, requisitos e histórico em um único fluxo.",
              },
              {
                icon: BarChart3,
                title: "Cotações comparáveis",
                description:
                  "Termos comerciais organizados para análise rápida.",
              },
              {
                icon: ShieldCheck,
                title: "Dados protegidos",
                description:
                  "Acesso por usuário e políticas de segurança na base.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-xl border border-white/15 bg-slate-950/40 p-5 backdrop-blur-sm"
                key={title}
              >
                <Icon className="text-sky-200" size={22} />
                <h2 className="mt-4 font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-5 text-xs text-slate-400">
          CotaçãoAI · Gestão profissional de compras e cotações.
        </footer>
      </div>
    </main>
  );
}
