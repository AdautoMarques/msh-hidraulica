"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Receipt, ArrowRight } from "lucide-react";

type NextAppt = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [openWorkOrders, setOpenWorkOrders] = useState(0);
  const [invoicesThisMonth, setInvoicesThisMonth] = useState(0);
  const [nextAppointments, setNextAppointments] = useState<NextAppt[]>([]);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      if (!res.ok) {
        // fallback seguro
        setAppointmentsToday(0);
        setOpenWorkOrders(0);
        setInvoicesThisMonth(0);
        setNextAppointments([]);
        return;
      }

      const data = await res.json();

      setAppointmentsToday(data.appointmentsToday ?? 0);
      setOpenWorkOrders(data.openWorkOrders ?? 0);
      setInvoicesThisMonth(data.invoicesThisMonth ?? 0);
      setNextAppointments(data.nextAppointments ?? []);
    } catch (err) {
      console.error("Erro ao carregar dashboard", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      title: "Hoje",
      value: loading ? "—" : String(appointmentsToday),
      subtitle: "agendamentos",
      icon: <CalendarDays size={18} className="text-white/70" />,
      href: "/admin/agenda",
    },
    {
      title: "OS",
      value: loading ? "—" : String(openWorkOrders),
      subtitle: "em aberto",
      icon: <ClipboardList size={18} className="text-white/70" />,
      href: "/admin/os", // ✅ rota correta
    },
    {
      title: "Notas",
      value: loading ? "—" : String(invoicesThisMonth),
      subtitle: "emitidas no mês",
      icon: <Receipt size={18} className="text-white/70" />,
      href: "/admin/notas",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Visão geral</div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-white/60">
            Acompanhe agenda, ordens de serviço e notas.
          </p>
        </div>

        <Link
          href="/admin/agenda"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Ver agenda <ArrowRight size={16} />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur hover:bg-black/40 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-white/70">{c.title}</div>
                <div className="mt-2 text-3xl font-semibold leading-none">
                  {c.value}
                </div>
                <div className="mt-1 text-sm text-white/60">{c.subtitle}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                {c.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Próximos agendamentos */}
      <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-sm font-medium">Próximos agendamentos</div>
            <div className="text-xs text-white/60">
              Os próximos horários marcados
            </div>
          </div>
          <Link
            href="/admin/agenda"
            className="text-sm text-white/70 hover:text-white inline-flex items-center gap-2"
          >
            Abrir <ArrowRight size={16} />
          </Link>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Carregando...
            </div>
          ) : nextAppointments.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Nenhum agendamento futuro encontrado.
            </div>
          ) : (
            <div className="grid gap-3">
              {nextAppointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      {fmtTime(a.startAt)} – {fmtTime(a.endAt)} • {a.clientName}
                    </div>
                    <div className="text-xs text-white/60">{a.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {a.serviceName}
                    {a.clientPhone ? ` • ${a.clientPhone}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
