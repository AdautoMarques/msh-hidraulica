"use client";

import { useSearchParams } from "next/navigation";

export default function AcompanharClient() {
  const sp = useSearchParams();

  // exemplo: /agendar/acompanhar?protocolo=XYZ
  const protocolo = sp.get("protocolo") ?? "";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur">
          <div className="text-xs text-white/60">Acompanhar</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Acompanhar Agendamento
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Informe o protocolo para consultar o status.
          </p>

          <div className="mt-5 grid gap-3">
            <label className="text-sm text-white/70">Protocolo</label>
            <input
              defaultValue={protocolo}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
              placeholder="Ex: ABC123"
            />

            <button className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15">
              Consultar
            </button>

            <div className="text-xs text-white/50">
              Dica: você pode compartilhar o link com o protocolo no final.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
