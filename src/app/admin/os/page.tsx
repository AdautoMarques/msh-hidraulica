import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function getServiceOrders() {
  return prisma.serviceOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { name: true, phone: true } },
      invoice: { select: { id: true, number: true, status: true } },
      appointment: {
        select: {
          id: true,
          startAt: true,
          service: { select: { name: true } },
        },
      },
    },
  });
}

type SOResult = Awaited<ReturnType<typeof getServiceOrders>>;
type ServiceOrderListItem = SOResult[number];

const statusLabel: Record<string, string> = {
  OPEN: "Em aberto",
  IN_PROGRESS: "Em andamento",
  WAITING_PARTS: "Aguardando peças",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

function fmtDateTime(iso: Date | string | null | undefined) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OSPage() {
  const orders: ServiceOrderListItem[] = await getServiceOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Admin</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Veja todas as OS, edite e gere notas.
          </p>
        </div>

        <Link
          href="/admin/agenda"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Ver agenda →
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-sm font-medium">{orders.length} OS</div>
          <div className="text-xs text-white/60">
            Clique em uma OS para abrir detalhes.
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {orders.length === 0 ? (
            <div className="p-5 text-sm text-white/60">
              Nenhuma ordem de serviço ainda.
            </div>
          ) : (
            orders.map((so) => (
              <Link
                key={so.id}
                href={`/admin/os/${so.id}`}
                className="block p-5 transition hover:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      OS #{so.number} • {so.title}
                    </div>

                    <div className="mt-1 text-xs text-white/60">
                      {statusLabel[String(so.status)] ?? String(so.status)}
                      {" • "}
                      {so.customer?.name ?? "Sem cliente"}
                      {so.customer?.phone ? ` • ${so.customer.phone}` : ""}
                    </div>

                    {so.appointment?.startAt ? (
                      <div className="mt-1 text-xs text-white/60">
                        Agenda: {fmtDateTime(so.appointment.startAt)}
                        {so.appointment?.service?.name
                          ? ` • ${so.appointment.service.name}`
                          : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {moneyBRL(so.totalCents)}
                    </div>

                    {so.invoice ? (
                      <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-100">
                        🧾 Nota #{so.invoice.number}
                      </div>
                    ) : (
                      <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                        Sem nota
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
