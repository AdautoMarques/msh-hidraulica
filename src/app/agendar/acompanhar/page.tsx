"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  ExternalLink,
  Search,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | "DONE" | "NO_SHOW";
  notes: string | null;
  service: {
    id: string;
    name: string;
    durationMin: number;
    basePrice: number;
  };
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}
function fmtMoneyBRL(cents: number) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function cleanPhone(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const map: Record<
    Appointment["status"],
    { label: string; cls: string; icon: any }
  > = {
    PENDING: {
      label: "Pendente",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-100",
      icon: Clock,
    },
    CONFIRMED: {
      label: "Confirmado",
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
      icon: CheckCircle2,
    },
    CANCELED: {
      label: "Cancelado",
      cls: "border-red-500/30 bg-red-500/10 text-red-100",
      icon: Ban,
    },
    DONE: {
      label: "Concluído",
      cls: "border-sky-500/30 bg-sky-500/10 text-sky-100",
      icon: CheckCircle2,
    },
    NO_SHOW: {
      label: "Não compareceu",
      cls: "border-white/10 bg-white/5 text-white/70",
      icon: Clock,
    },
  };

  const s = map[status];
  const Icon = s.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${s.cls}`}
    >
      <Icon size={14} />
      {s.label}
    </span>
  );
}

export default function AcompanharAgendamentoPage() {
  const sp = useSearchParams();
  const initialRef = sp.get("ref") ?? "";

  const [ref, setRef] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  async function fetchAppt(id: string) {
    setLoading(true);
    setError(null);
    setOkMsg(null);
    setAppointment(null);

    const res = await fetch(
      `/api/public/appointments/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Não foi possível buscar o agendamento.");
      return;
    }

    setAppointment(data?.appointment ?? null);
  }

  useEffect(() => {
    if (initialRef) fetchAppt(initialRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waLink = useMemo(() => {
    // Coloque o número real aqui (DDI+DDD+NUM). Ex: 5514999999999
    const WHATSAPP_NUMBER = "5514999999999";

    if (!appointment) return `https://wa.me/${WHATSAPP_NUMBER}`;
    const when = `${fmtDate(appointment.startAt)} ${fmtTime(
      appointment.startAt
    )}–${fmtTime(appointment.endAt)}`;
    const phone = appointment.customer.phone
      ? cleanPhone(appointment.customer.phone)
      : "";
    const msg =
      `Olá! Estou acompanhando meu agendamento.\n` +
      `Ref: ${appointment.id}\n` +
      `Cliente: ${appointment.customer.name}${phone ? ` (${phone})` : ""}\n` +
      `Serviço: ${appointment.service.name}\n` +
      `Quando: ${when}\n` +
      `Status: ${appointment.status}\n`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [appointment]);

  async function cancel() {
    if (!appointment) return;

    const can =
      appointment.status === "PENDING" || appointment.status === "CONFIRMED";
    if (!can) return;

    const yes = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?"
    );
    if (!yes) return;

    setCanceling(true);
    setError(null);
    setOkMsg(null);

    const res = await fetch(
      `/api/public/appointments/${encodeURIComponent(appointment.id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }
    );

    const data = await res.json().catch(() => ({}));
    setCanceling(false);

    if (!res.ok) {
      setError(data?.error ?? "Erro ao cancelar.");
      return;
    }

    setOkMsg("Agendamento cancelado com sucesso.");
    // recarrega
    fetchAppt(appointment.id);
  }

  const canCancel =
    appointment &&
    (appointment.status === "PENDING" || appointment.status === "CONFIRMED");

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* fundo glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-28 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-[-240px] left-1/3 h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs text-white/60">MSH Hidráulica</div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Acompanhar agendamento
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Cole o código (ref) que apareceu após agendar.
            </p>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Falar no WhatsApp <ExternalLink size={16} />
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-sm font-medium">Buscar</div>
            <div className="text-xs text-white/60">
              Ex: cmjkahvse0004w3w878u1fb2m
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/25"
                placeholder="Cole o código do agendamento (ref)"
              />
              <button
                onClick={() => ref && fetchAppt(ref)}
                disabled={!ref || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                <Search size={16} />
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100 inline-flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {okMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                {okMsg}
              </div>
            )}
          </div>
        </div>

        {appointment && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Detalhes</div>
                  <div className="text-xs text-white/60">
                    Ref: {appointment.id}
                  </div>
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="p-5 space-y-3 text-sm text-white/80">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Data e horário</div>
                  <div className="mt-1 font-medium">
                    {fmtDate(appointment.startAt)} •{" "}
                    {fmtTime(appointment.startAt)} –{" "}
                    {fmtTime(appointment.endAt)}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Serviço</div>
                  <div className="mt-1 font-medium">
                    {appointment.service.name}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
                    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">
                      Duração: {appointment.service.durationMin} min
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">
                      Base: {fmtMoneyBRL(appointment.service.basePrice)}
                    </span>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Observações</div>
                    <div className="mt-1">{appointment.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="text-sm font-medium">Cliente</div>
                <div className="text-xs text-white/60">
                  Dados informados no agendamento
                </div>
              </div>

              <div className="p-5 space-y-3 text-sm text-white/80">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Nome</div>
                  <div className="mt-1 font-medium">
                    {appointment.customer.name}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">WhatsApp</div>
                    <div className="mt-1 font-medium">
                      {appointment.customer.phone ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">E-mail</div>
                    <div className="mt-1 font-medium">
                      {appointment.customer.email ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
                  >
                    Falar no WhatsApp <ExternalLink size={16} />
                  </a>

                  <button
                    onClick={cancel}
                    disabled={!canCancel || canceling}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 hover:bg-red-500/15 disabled:opacity-60"
                  >
                    <Ban size={16} />
                    {canceling ? "Cancelando..." : "Cancelar"}
                  </button>
                </div>

                <div className="text-xs text-white/50">
                  * Cancelamento disponível enquanto estiver{" "}
                  <span className="text-white/70">Pendente</span> ou{" "}
                  <span className="text-white/70">Confirmado</span>.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
