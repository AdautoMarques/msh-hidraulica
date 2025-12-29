import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

type InvoiceRow = {
  id: string;
  number: number;
  status: "DRAFT" | "ISSUED" | "CANCELED" | "PAID";
  totalCents: number;

  customer: { name: string | null } | null;
  serviceOrder: { number: number } | null;

  createdAt: Date;
};

export default async function Page({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();

  const where: any = {};
  if (status) where.status = status;

  if (q) {
    const qAsNumber = Number(q);
    const or: any[] = [
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];

    if (!Number.isNaN(qAsNumber)) {
      or.push({ number: qAsNumber });
    }

    where.OR = or;
  }

  const invoices = (await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { name: true } },
      serviceOrder: { select: { number: true } },
    },
    select: undefined, // (só para deixar claro que estamos usando include)
  })) as unknown as InvoiceRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Admin</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notas / Faturas
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Acompanhe as notas emitidas.
          </p>
        </div>

        <Link
          href="/admin/os"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Ver OS →
        </Link>
      </div>

      <form className="grid gap-3 md:grid-cols-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por cliente ou número..."
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
        />

        <select
          name="status"
          defaultValue={status}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
        >
          <option value="">Todos os status</option>
          <option value="DRAFT">Rascunho</option>
          <option value="ISSUED">Emitida</option>
          <option value="PAID">Paga</option>
          <option value="CANCELED">Cancelada</option>
        </select>

        <button
          type="submit"
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15"
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-sm font-medium">{invoices.length} nota(s)</div>
          <div className="text-xs text-white/60">
            Clique para abrir detalhes.
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {invoices.length === 0 ? (
            <div className="p-5 text-sm text-white/60">Nenhuma nota.</div>
          ) : (
            invoices.map((inv: InvoiceRow) => (
              <Link
                key={inv.id}
                href={`/admin/notas/${inv.id}`}
                className="block p-5 hover:bg-white/5 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      Nota #{inv.number} • {inv.customer?.name ?? "Sem cliente"}
                    </div>

                    <div className="mt-1 text-xs text-white/60">
                      Status: {inv.status}
                      {inv.serviceOrder
                        ? ` • OS #${inv.serviceOrder.number}`
                        : ""}
                    </div>
                  </div>

                  <div className="text-sm font-semibold">
                    {moneyBRL(inv.totalCents)}
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
