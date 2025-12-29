import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";
import DownloadInvoicePdfButton from "@/components/DownloadInvoicePdfButton";

export const dynamic = "force-dynamic";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dtBR(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!id || id.trim() === "") notFound();

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      serviceOrder: true,
      items: true,
    },
  });

  if (!inv) notFound();

  return (
    <div className="space-y-6">
      {/* ===== CSS DE IMPRESSÃO ===== */}
      <style>{`
        @media print {
          @page { margin: 12mm; }

          body * {
            visibility: hidden !important;
          }

          #print-area,
          #print-area * {
            visibility: visible !important;
          }

          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          html, body {
            background: #fff !important;
          }

          .print-card {
            background: #fff !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }

          .print-muted { color: #444 !important; }
          .print-title { color: #111 !important; }
        }
      `}</style>

      {/* ===== CABEÇALHO (TELA) ===== */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Nota / Fatura</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nota #{inv.number}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Cliente: {inv.customer?.name ?? "-"} • Status: {inv.status}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DownloadInvoicePdfButton invoiceId={inv.id} />
          <PrintButton />

          {inv.serviceOrder?.id && (
            <Link
              href={`/admin/os/${inv.serviceOrder.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Voltar para OS
            </Link>
          )}

          <Link
            href="/admin/notas"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {/* ===== ÁREA DE IMPRESSÃO ===== */}
      <div id="print-area" className="max-w-[820px]">
        {/* Cabeçalho da Nota */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur print-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold print-title">
                MSH Hidráulica
              </div>
              <div className="mt-1 text-xs text-white/60 print-muted">
                Documento: Nota / Fatura
              </div>
              <div className="mt-2 text-xs text-white/60 print-muted">
                Emitida em: {dtBR(inv.issuedAt)} • Venc.: {dtBR(inv.dueAt)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-white/60 print-muted">Nº</div>
              <div className="text-lg font-semibold print-title">
                {inv.number}
              </div>
              <div className="mt-1 text-xs text-white/60 print-muted">
                Status: {inv.status}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 print-card">
              <div className="text-xs text-white/60 print-muted">Cliente</div>
              <div className="mt-1 text-sm font-medium print-title">
                {inv.customer?.name ?? "-"}
              </div>
              <div className="mt-1 text-xs text-white/60 print-muted">
                {inv.customer?.phone ?? ""}
                {inv.customer?.email ? ` • ${inv.customer.email}` : ""}
              </div>
              {inv.customer?.address && (
                <div className="mt-2 text-xs text-white/60 print-muted">
                  {inv.customer.address}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 print-card">
              <div className="text-xs text-white/60 print-muted">
                Referência
              </div>
              <div className="mt-1 text-sm font-medium print-title">
                {inv.serviceOrder
                  ? `OS #${inv.serviceOrder.number}`
                  : "Sem OS vinculada"}
              </div>
              <div className="mt-1 text-xs text-white/60 print-muted">
                Pago em: {dtBR(inv.paidAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur print-card">
          <div className="border-b border-white/10 px-5 py-4 print-card">
            <div className="text-sm font-medium print-title">Itens</div>
            <div className="text-xs text-white/60 print-muted">
              {inv.items.length} item(ns)
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {inv.items.length === 0 ? (
              <div className="p-5 text-sm text-white/60 print-muted">
                Sem itens.
              </div>
            ) : (
              inv.items.map((it) => (
                <div key={it.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium print-title">
                        {it.description}
                      </div>
                      <div className="mt-1 text-xs text-white/60 print-muted">
                        Qtd: {it.qty} • Unit: {moneyBRL(it.unitCents)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold print-title">
                      {moneyBRL(it.totalCents)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totais */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur print-card">
          <div className="text-sm font-medium print-title">Totais</div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60 print-muted">Subtotal</span>
              <span className="font-medium print-title">
                {moneyBRL(inv.subtotalCents)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 print-muted">Desconto</span>
              <span className="font-medium print-title">
                {moneyBRL(inv.discountCents)}
              </span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-white/60 print-muted">Total</span>
              <span className="text-base font-semibold print-title">
                {moneyBRL(inv.totalCents)}
              </span>
            </div>
          </div>

          <div className="mt-4 text-xs text-white/60 print-muted">
            Observação: este documento é uma fatura/recibo interno.
          </div>
        </div>
      </div>
    </div>
  );
}
