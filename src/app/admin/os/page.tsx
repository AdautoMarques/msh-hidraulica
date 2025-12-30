import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  WAITING_PARTS: "Aguardando peças",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

function statusPill(status: string) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
  switch (status) {
    case "OPEN":
      return `${base} border-sky-500/30 bg-sky-500/15 text-sky-100`;
    case "IN_PROGRESS":
      return `${base} border-amber-500/30 bg-amber-500/15 text-amber-100`;
    case "WAITING_PARTS":
      return `${base} border-violet-500/30 bg-violet-500/15 text-violet-100`;
    case "DONE":
      return `${base} border-emerald-500/30 bg-emerald-500/15 text-emerald-100`;
    case "CANCELED":
      return `${base} border-rose-500/30 bg-rose-500/15 text-rose-100`;
    default:
      return `${base} border-white/10 bg-white/5 text-white/80`;
  }
}

// ✅ Tipo correto do retorno (com includes)
type ServiceOrderListItem = Prisma.ServiceOrderGetPayload<{
  include: {
    customer: true;
    invoice: true;
    appointment: { include: { service: true } };
  };
}>;

export default async function Page({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();

  // ✅ sem any: tipa o where corretamente
  const where: Prisma.ServiceOrderWhereInput = {};
  if (status) where.status = status as any; // (se status for enum no Prisma, podemos ajustar; assim não quebra build)

  if (q) {
    const n = Number(q);
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      ...(Number.isFinite(n) ? [{ number: n }] : []),
    ] as Prisma.ServiceOrderWhereInput["OR"];
  }

  const orders: ServiceOrderListItem[] = await prisma.serviceOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: true,
      invoice: true,
      appointment: { include: { service: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Admin</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Visualize todas as OS, filtre e gere a nota.
          </p>
        </div>

        <Link
          href="/admin/agenda"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Ver agenda →
        </Link>
      </div>

      {/* Filtros */}
      <form className="grid gap-3 md:grid-cols-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por cliente, título ou nº..."
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
        />

        <select
          name="status"
          defaultValue={status}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
        >
          <option value="">Todos os status</option>
          <option value="OPEN">Aberta</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="WAITING_PARTS">Aguardando peças</option>
          <option value="DONE">Concluída</option>
          <option value="CANCELED">Cancelada</option>
        </select>

        <button
          type="submit"
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15"
        >
          Filtrar
        </button>
      </form>

      {/* Lista */}
      <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-sm font-medium">{orders.length} OS</div>
          <div className="text-xs text-white/60">
            Clique para abrir a OS. Ações rápidas à direita.
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {orders.length === 0 ? (
            <div className="p-5 text-sm text-white/60">
              Nenhuma OS encontrada.
            </div>
          ) : (
            orders.map((so) => (
              <div key={so.id} className="p-5 transition hover:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Link href={`/admin/os/${so.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium">
                        OS #{so.number} • {so.customer?.name ?? "Sem cliente"}
                      </div>
                      <span className={statusPill(String(so.status))}>
                        {STATUS_LABEL[String(so.status)] ?? String(so.status)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-white/60">
                      {so.title}
                      {so.appointment?.service?.name
                        ? ` • ${so.appointment.service.name}`
                        : ""}
                      {so.invoice ? ` • Nota #${so.invoice.number}` : ""}
                    </div>

                    <div className="mt-2 text-sm text-white/80">
                      Total:{" "}
                      <span className="font-semibold">
                        {moneyBRL(so.totalCents)}
                      </span>
                      {so.laborCents ? (
                        <span className="text-white/60">
                          {" "}
                          • Mão de obra: {moneyBRL(so.laborCents)}
                        </span>
                      ) : null}
                    </div>
                  </Link>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/os/${so.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      ✏️ Editar
                    </Link>

                    {so.invoice ? (
                      <Link
                        href={`/admin/notas/${so.invoice.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
                      >
                        🧾 Ver Nota
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/os/${so.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
                      >
                        🧾 Gerar Nota
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
