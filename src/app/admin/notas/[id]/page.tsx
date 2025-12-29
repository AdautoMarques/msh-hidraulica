import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  unitCents: number;
  totalCents: number;
};

type InvoiceDetail = {
  id: string;
  number: number;
  status: "DRAFT" | "ISSUED" | "CANCELED" | "PAID";
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;

  subtotalCents: number;
  discountCents: number;
  totalCents: number;

  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
    address: string | null;
  } | null;

  serviceOrder: {
    id: string;
    number: number;
    title: string;
  } | null;

  items: InvoiceItem[];

  createdAt: Date;
  updatedAt: Date;
};

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d?: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!id || id.trim() === "") notFound();

  const inv = (await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      serviceOrder: true,
      items: true,
    },
  })) as unknown as InvoiceDetail | null;

  if (!inv) notFound();

  const pdfHref = `/api/admin/invoices/${inv.id}/pdf`;

  return (
    <>
      {/* CSS de impressão: imprime só o cartão da nota */}
      <style>{`
        @media print {
          /* Esconde tudo da interface */
          body * {
            visibility: hidden !important;
          }
          /* Mostra apenas a nota */
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          /* Remove sombras/fundos pesados */
          .no-print {
            display: none !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: #fff !important;
            color: #111 !important;
          }
          .print-muted { color: #444 !important; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Topbar (não imprime) */}
        <div className="no-print flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs text-white/60">Admin</div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Nota / Fatura #{inv.number}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Status: <span className="text-white/80">{inv.status}</span>
              {inv.serviceOrder ? (
                <>
                  {" "}
                  • OS{" "}
                  <Link
                    className="text-white/80 underline underline-offset-2 hover:text-white"
                    href={`/admin/os/${inv.serviceOrder.id}`}
                  >
                    #{inv.serviceOrder.number}
                  </Link>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15"
            >
              🖨️ Imprimir
            </button>

            <a
              href={pdfHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
            >
              ⬇️ Baixar PDF
            </a>

            <Link
              href="/admin/notas"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Voltar
            </Link>
          </div>
        </div>

        {/* ====== NOTA (essa área é a única que imprime) ====== */}
        <div id="print-area" className="mx-auto max-w-3xl">
          <div className="print-card rounded-2xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur">
            {/* Cabeçalho da Nota */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/60 print-muted">
                  MSH Hidráulica
                </div>
                <div className="text-2xl font-semibold tracking-tight">
                  Nota / Fatura
                </div>
                <div className="mt-1 text-sm text-white/60 print-muted">
                  Nº <span className="text-white/90">{inv.number}</span>
                </div>
              </div>

              <div className="text-sm text-white/70 print-muted">
                <div>
                  <span className="text-white/60 print-muted">Status:</span>{" "}
                  <span className="text-white/90">{inv.status}</span>
                </div>
                <div>
                  <span className="text-white/60 print-muted">Emissão:</span>{" "}
                  <span className="text-white/90">{fmtDate(inv.issuedAt)}</span>
                </div>
                <div>
                  <span className="text-white/60 print-muted">Vencimento:</span>{" "}
                  <span className="text-white/90">{fmtDate(inv.dueAt)}</span>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 print-card">
                <div className="text-sm font-medium">Cliente</div>
                <div className="mt-2 text-sm text-white/80 print-muted space-y-1">
                  <div>
                    <span className="text-white/60 print-muted">Nome:</span>{" "}
                    <span className="text-white/90">
                      {inv.customer?.name ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60 print-muted">Telefone:</span>{" "}
                    <span className="text-white/90">
                      {inv.customer?.phone ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60 print-muted">E-mail:</span>{" "}
                    <span className="text-white/90">
                      {inv.customer?.email ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60 print-muted">
                      Documento:
                    </span>{" "}
                    <span className="text-white/90">
                      {inv.customer?.document ?? "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 print-card">
                <div className="text-sm font-medium">Referência</div>
                <div className="mt-2 text-sm text-white/80 print-muted space-y-1">
                  <div>
                    <span className="text-white/60 print-muted">OS:</span>{" "}
                    <span className="text-white/90">
                      {inv.serviceOrder ? `#${inv.serviceOrder.number}` : "-"}
                    </span>
                  </div>
                  <div className="text-white/70 print-muted">
                    {inv.serviceOrder?.title ?? ""}
                  </div>
                  <div>
                    <span className="text-white/60 print-muted">Endereço:</span>{" "}
                    <span className="text-white/90">
                      {inv.customer?.address ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itens */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 print-card">
              <div className="grid grid-cols-12 gap-2 border-b border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60 print-muted">
                <div className="col-span-7">Descrição</div>
                <div className="col-span-2 text-right">Qtd</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              {inv.items.length === 0 ? (
                <div className="p-4 text-sm text-white/60 print-muted">
                  Nenhum item cadastrado.
                </div>
              ) : (
                inv.items.map((it: InvoiceItem) => (
                  <div
                    key={it.id}
                    className="grid grid-cols-12 gap-2 border-b border-white/10 px-4 py-3 text-sm"
                  >
                    <div className="col-span-7">
                      <div className="font-medium">{it.description}</div>
                      <div className="text-xs text-white/60 print-muted">
                        {moneyBRL(it.unitCents)} / un
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-white/80 print-muted">
                      {it.qty}
                    </div>
                    <div className="col-span-3 text-right font-semibold">
                      {moneyBRL(it.totalCents)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totais */}
            <div className="mt-6 grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm print-card">
              <div className="flex items-center justify-between">
                <span className="text-white/60 print-muted">Subtotal</span>
                <span className="font-medium">
                  {moneyBRL(inv.subtotalCents)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/60 print-muted">Desconto</span>
                <span className="font-medium">
                  {moneyBRL(inv.discountCents)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-white/60 print-muted">Total</span>
                <span className="text-lg font-semibold">
                  {moneyBRL(inv.totalCents)}
                </span>
              </div>
            </div>

            {/* Rodapé */}
            <div className="mt-6 text-center text-xs text-white/50 print-muted">
              MSH Hidráulica • Documento gerado pelo sistema •{" "}
              {new Date(inv.createdAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
