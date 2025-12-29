"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

const WHATSAPP_NUMBER = "5514999999999"; // 🔁 troque pelo WhatsApp real (DDI+DDD+NUM)

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function AgendarSuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const ref = sp.get("ref") ?? "";

  const waLink = useMemo(() => {
    const text =
      `Olá! Acabei de solicitar um agendamento na MSH Hidráulica.\n` +
      `Código: ${ref}\n` +
      `Poderiam confirmar, por favor?`;
    return `https://wa.me/${onlyDigits(
      WHATSAPP_NUMBER
    )}?text=${encodeURIComponent(text)}`;
  }, [ref]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute top-28 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
      </div>

      <div className="relative mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <CheckCircle2 className="text-emerald-200" />
            </div>
            <div>
              <div className="text-xs text-white/60">MSH Hidráulica</div>
              <h1 className="mt-1 text-2xl font-semibold">
                Agendamento enviado!
              </h1>
              <p className="mt-2 text-sm text-white/70">
                Sua solicitação foi registrada como <b>PENDENTE</b>. Vamos
                confirmar pelo WhatsApp.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Código do agendamento</div>
            <div className="mt-1 font-mono text-sm break-all">{ref || "—"}</div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/15"
            >
              <MessageCircle size={18} />
              Falar no WhatsApp
            </a>

            <button
              onClick={() =>
                router.push(
                  `/agendar/acompanhar?ref=${encodeURIComponent(ref)}`
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Acompanhar agendamento
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Você pode acompanhar o status, reagendar ou cancelar enquanto
            estiver
            <span className="text-white/70"> Pendente</span>.
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
