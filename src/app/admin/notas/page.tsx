import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ✅ Inferência de tipo via PromiseReturnType (não depende de InvoiceGetPayload)
async function getInvoices() {
  return prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { name: true } },
      serviceOrder: { select: { number: true } },
    },
  });
}

type InvoiceRow = Prisma.PromiseReturnType<typeof getInvoices>[number];

export default async function NotasPage() {
  const invoices: InvoiceRow[] = await getInvoices();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Admin</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notas / Faturas
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Visualize todas as notas emitidas.
          </p>
        </div>

        <Link
          href="/admin/os"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Ver OS →
        </Link>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-sm font-medium">{invoices.length} nota(s)</div>
          <div className="text-xs text-white/60">
            Clique para abrir os detalhes.
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {invoices.length === 0 ? (
            <div className="p-5 text-sm text-white/60">
              Nenhuma nota encontrada.
            </div>
          ) : (
            invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/admin/notas/${inv.id}`}
                className="block p-5 transition hover:bg-white/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      Nota #{inv.number} • {inv.customer?.name ?? "Sem cliente"}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      Status: {inv.status}
                      {inv.serviceOrder?.number
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
