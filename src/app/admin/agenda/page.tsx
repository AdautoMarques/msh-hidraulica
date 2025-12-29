"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCcw,
  CheckCircle2,
  Ban,
  Clock,
  FileText,
} from "lucide-react";

type Slot = {
  startAt: string;
  endAt: string;
  free: boolean;
  reason?: "BOOKED" | "TIME_OFF";
};

type Appt = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  durationMin: number | null;
};

function isoDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    CONFIRMED: {
      label: "Confirmado",
      cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
      icon: CheckCircle2,
    },
    PENDING: {
      label: "Pendente",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-100",
      icon: Clock,
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
      cls: "border-zinc-500/30 bg-white/5 text-white/70",
      icon: Clock,
    },
  };
  const s = map[status] ?? {
    label: status,
    cls: "border-white/10 bg-white/5 text-white/70",
    icon: Clock,
  };
  const Icon = s.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${s.cls}`}
    >
      <Icon size={14} />
      {s.label}
    </span>
  );
}

export default function AdminAgendarPage() {
  const [day, setDay] = useState<string>(() => isoDay(new Date()));
  const [stepMin, setStepMin] = useState<number>(30);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(false);

  const [osCreatingId, setOsCreatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/agenda?day=${day}&stepMin=${stepMin}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    setSlots(data.slots ?? []);
    setAppointments(data.appointments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, stepMin]);

  const apptByRange = useMemo(() => {
    const m = new Map<string, Appt>();
    for (const a of appointments) {
      m.set(`${a.startAt}_${a.endAt}`, a);
    }
    return m;
  }, [appointments]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await load();
  }

  async function createOS(appointmentId: string) {
    try {
      setToast(null);
      setOsCreatingId(appointmentId);

      const res = await fetch("/api/admin/service-orders/from-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setToast(data?.error ?? "Erro ao gerar OS.");
        return;
      }

      const soId = String(data?.serviceOrderId ?? "");
      setToast(
        data?.alreadyExisted
          ? "OS já existia. Abrindo..."
          : "OS criada! Abrindo..."
      );

      // Quando a página existir, isso já abre direto.
      window.location.href = `/admin/os/${encodeURIComponent(soId)}`;
    } finally {
      setOsCreatingId(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-white/60">Agendamentos</div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-white/60">
            Horários livres são calculados por BusinessHours + TimeOff + Agenda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <CalendarDays size={18} className="text-white/70" />
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="bg-transparent text-sm text-white/80 outline-none"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-xs text-white/60">grade</span>
            <select
              value={stepMin}
              onChange={(e) => setStepMin(Number(e.target.value))}
              className="bg-transparent text-sm text-white/80 outline-none"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <RefreshCcw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Slots */}
        <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="text-sm font-medium">Horários do dia</div>
            <div className="text-xs text-white/60">
              Verde = livre • Bloqueado = TimeOff • Ocupado = agendamento
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-sm text-white/60">Carregando...</div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Sem horários — configure BusinessHours para este dia da semana.
              </div>
            ) : (
              <div className="grid gap-2">
                {slots.map((s) => {
                  const key = `${s.startAt}_${s.endAt}`;
                  const appt = apptByRange.get(key);

                  const cls = s.free
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : s.reason === "TIME_OFF"
                    ? "border-amber-500/20 bg-amber-500/10"
                    : "border-white/10 bg-white/5";

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${cls}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {fmtTime(s.startAt)} – {fmtTime(s.endAt)}
                        </div>
                        {!s.free && s.reason === "TIME_OFF" && (
                          <span className="text-xs text-amber-100">
                            Bloqueado
                          </span>
                        )}
                        {!s.free && s.reason === "BOOKED" && appt && (
                          <Badge status={appt.status} />
                        )}
                        {s.free && (
                          <span className="text-xs text-emerald-100">
                            Livre
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-white/70">
                        {appt ? `${appt.clientName} • ${appt.serviceName}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Agendamentos */}
        <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="text-sm font-medium">Agendamentos</div>
            <div className="text-xs text-white/60">
              Confirme, cancele, finalize e gere OS.
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-sm text-white/60">Carregando...</div>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Nenhum agendamento para este dia.
              </div>
            ) : (
              <div className="grid gap-3">
                {appointments.map((a) => {
                  const canCreate = a.status === "CONFIRMED";
                  const creating = osCreatingId === a.id;

                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">
                            {fmtTime(a.startAt)} – {fmtTime(a.endAt)} •{" "}
                            {a.clientName}
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            {a.serviceName}
                            {a.clientPhone ? ` • ${a.clientPhone}` : ""}
                          </div>
                          {a.notes && (
                            <div className="mt-2 text-xs text-white/60">
                              Obs: {a.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge status={a.status} />

                          <button
                            onClick={() => setStatus(a.id, "CONFIRMED")}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-black/40"
                          >
                            <CheckCircle2 size={16} />
                            Confirmar
                          </button>

                          <button
                            onClick={() => setStatus(a.id, "DONE")}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/15"
                          >
                            <CheckCircle2 size={16} />
                            Concluir
                          </button>

                          <button
                            onClick={() => setStatus(a.id, "CANCELED")}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/15"
                          >
                            <Ban size={16} />
                            Cancelar
                          </button>

                          <button
                            disabled={!canCreate || creating}
                            onClick={() => createOS(a.id)}
                            title={
                              !canCreate
                                ? "Confirme o agendamento para gerar OS"
                                : ""
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FileText size={16} />
                            {creating ? "Gerando..." : "Gerar OS"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
