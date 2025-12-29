"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type Slot = {
  startAt: string;
  endAt: string;
  free: boolean;
  reason?: "BOOKED" | "TIME_OFF";
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  basePrice: number;
};

function isoDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function fmtMoneyBRL(cents: number) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cleanPhone(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function PublicAgendaPage() {
  const router = useRouter();

  const [day, setDay] = useState(() => isoDay(new Date()));

  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");

  const [durationMin, setDurationMin] = useState<number>(60);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  /* ============================
   * 1) CARREGA SERVIÇOS
   * ============================ */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/public/services", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      const list: Service[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.services)
        ? data.services
        : [];

      setServices(list);

      if (list.length) {
        const first = list[0];
        setServiceId(first.id);
        setDurationMin(first.durationMin || 60);
      }
    })();
  }, []);

  /* ============================
   * 2) AO TROCAR SERVIÇO
   * ============================ */
  useEffect(() => {
    const s = services.find((x) => x.id === serviceId);
    if (!s) return;

    setDurationMin(s.durationMin || 60);
    setSelected(null); // limpa slot incompatível
  }, [serviceId, services]);

  /* ============================
   * 3) CARREGA SLOTS
   * ============================ */
  useEffect(() => {
    if (!serviceId) return;

    (async () => {
      setLoadingSlots(true);
      setError(null);
      setOkMsg(null);

      const res = await fetch(
        `/api/public/slots?day=${day}&serviceId=${encodeURIComponent(
          serviceId
        )}`,
        { cache: "no-store" }
      );

      const data = await res.json().catch(() => ({}));
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
      setLoadingSlots(false);
    })();
  }, [day, serviceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const selectedRangeLabel = useMemo(() => {
    if (!selected) return "Selecione um horário";
    return `${fmtTime(selected.startAt)} – ${fmtTime(selected.endAt)}`;
  }, [selected]);

  const canSubmit = useMemo(() => {
    return (
      !!serviceId &&
      !!selected?.startAt &&
      name.trim().length >= 2 &&
      cleanPhone(whatsapp).length >= 10
    );
  }, [serviceId, selected, name, whatsapp]);

  /* ============================
   * 4) SUBMIT
   * ============================ */
  async function submit() {
    setError(null);
    setOkMsg(null);

    if (!selected) {
      setError("Selecione um horário disponível.");
      return;
    }

    if (!serviceId) {
      setError("Selecione um serviço.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Informe seu nome.");
      return;
    }

    if (cleanPhone(whatsapp).length < 10) {
      setError("Informe um WhatsApp válido.");
      return;
    }

    setSubmitting(true);

    const payload = {
      serviceId,
      startAt: selected.startAt,
      endAt: selected.endAt,
      name: name.trim(),
      phone: cleanPhone(whatsapp),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const res = await fetch("/api/public/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data?.error ?? "Erro ao enviar agendamento.");
      return;
    }

    setOkMsg("Agendamento enviado! Vamos confirmar pelo WhatsApp.");
    router.push(`/agendar/success?ref=${data.appointmentId}`);
  }

  /* ============================
   * UI
   * ============================ */
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-28 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-white/60">MSH Hidráulica</div>
            <h1 className="text-3xl font-semibold">Agendar horário</h1>
            <p className="mt-1 text-sm text-white/60">
              A duração do serviço define os horários disponíveis.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <CalendarDays size={18} className="text-white/70" />
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="bg-transparent text-sm text-white/80 outline-none"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* ESQUERDA */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <label className="text-xs text-white/60">Serviço</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {selectedService && (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="font-medium">{selectedService.name}</div>
                  <div className="text-xs text-white/60">
                    {selectedService.description ?? "—"}
                  </div>
                  <div className="mt-2 text-xs text-white/70">
                    Duração: {durationMin} min • Base:{" "}
                    {fmtMoneyBRL(selectedService.basePrice)}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="text-sm font-medium">Horários disponíveis</div>

                <div className="mt-2 grid gap-2">
                  {loadingSlots ? (
                    <div className="text-sm text-white/60">
                      Carregando horários…
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-sm text-white/60">
                      Nenhum horário disponível.
                    </div>
                  ) : (
                    slots.map((s) => {
                      const isSelected =
                        selected?.startAt === s.startAt &&
                        selected?.endAt === s.endAt;

                      return (
                        <button
                          key={`${s.startAt}_${s.endAt}`}
                          disabled={!s.free}
                          onClick={() => setSelected(s)}
                          className={`flex justify-between rounded-xl border px-4 py-3 text-sm ${
                            s.free
                              ? "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15"
                              : "border-white/10 bg-white/5 opacity-60"
                          } ${isSelected ? "ring-2 ring-emerald-500/30" : ""}`}
                        >
                          <span>
                            {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                          </span>
                          <span className="text-xs">
                            {isSelected
                              ? "Selecionado"
                              : s.free
                              ? "Agendar"
                              : ""}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DIREITA */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-sm font-medium">Seus dados</div>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/60">Horário escolhido</div>
                <div className="font-medium">{selectedRangeLabel}</div>
              </div>

              <input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />

              <input
                placeholder="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />

              <input
                placeholder="E-mail (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />

              <textarea
                placeholder="Observações (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[96px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {okMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  <CheckCircle2 size={16} />
                  {okMsg}
                </div>
              )}

              <button
                disabled={!canSubmit || submitting}
                onClick={submit}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Confirmar agendamento"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
