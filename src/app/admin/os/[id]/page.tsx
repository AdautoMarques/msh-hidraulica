import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PageProps = {
  params: Promise<{ id: string }>; // ✅ Next 16: params é Promise
};

// ✅ Server Action: cria (ou abre) a Nota/Fatura da OS e redireciona
async function createInvoiceFromSO(serviceOrderId: string) {
  "use server";

  const so = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: { invoice: true },
  });

  if (!so) notFound();

  // Se já existe nota, abre ela
  if (so.invoice) {
    redirect(`/admin/notas/${so.invoice.id}`);
  }

  // Próximo número incremental de nota
  const last = await prisma.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const nextNumber = (last?.number ?? 0) + 1;
  const subtotal = so.totalCents ?? 0;

  // Cria nota com 1 item (baseado no total da OS)
  const invoice = await prisma.invoice.create({
    data: {
      number: nextNumber,
      status: "ISSUED",
      customerId: so.customerId,
      serviceOrderId: so.id,
      issuedAt: new Date(),
      subtotalCents: subtotal,
      discountCents: 0,
      totalCents: subtotal,
      items: {
        create: [
          {
            description: `Serviço: ${so.title ?? "Ordem de Serviço"}`,
            qty: 1,
            unitCents: subtotal,
            totalCents: subtotal,
          },
        ],
      },
    },
  });

  // (Opcional) marcar OS como DONE ao emitir nota
  await prisma.serviceOrder.update({
    where: { id: so.id },
    data: { status: "DONE" },
  });

  redirect(`/admin/notas/${invoice.id}`);
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!id || id.trim() === "") notFound();

  const so = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      appointment: { include: { service: true } },
      invoice: true,
    },
  });

  if (!so) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Ordem de Serviço</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            OS #{so.number}
          </h1>
          <p className="mt-1 text-sm text-white/60">{so.title}</p>
        </div>

        {/* ✅ Botões: Editar + Gerar/Ver Nota + Voltar */}
        <div className="flex flex-wrap gap-2">
          {/* ✏️ Editar */}
          <Link
            href={`/admin/os/${so.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ✏️ Editar
          </Link>

          {/* 🧾 Nota (sempre ao lado do Editar) */}
          {!so.invoice ? (
            <form action={createInvoiceFromSO.bind(null, so.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
              >
                🧾 Gerar Nota
              </button>
            </form>
          ) : (
            <Link
              href={`/admin/notas/${so.invoice.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/30"
            >
              🧾 Ver Nota #{so.invoice.number}
            </Link>
          )}

          {/* ← Voltar */}
          <Link
            href="/admin/os"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Detalhes */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur lg:col-span-2">
          <div className="text-sm font-medium">Detalhes</div>

          <div className="mt-3 space-y-2 text-sm text-white/80">
            <div>
              <span className="text-white/60">Status:</span>{" "}
              <span className="font-medium">{so.status}</span>
            </div>

            <div>
              <span className="text-white/60">Cliente:</span>{" "}
              <span className="font-medium">{so.customer?.name ?? "-"}</span>
            </div>

            {so.appointment?.service?.name && (
              <div>
                <span className="text-white/60">Serviço:</span>{" "}
                <span className="font-medium">
                  {so.appointment.service.name}
                </span>
              </div>
            )}

            {so.technician && (
              <div>
                <span className="text-white/60">Técnico:</span>{" "}
                <span className="font-medium">{so.technician}</span>
              </div>
            )}

            {so.description && (
              <div className="pt-2">
                <div className="text-white/60">Descrição</div>
                <div className="mt-1 rounded-xl border border-white/10 bg-white/5 p-3">
                  {so.description}
                </div>
              </div>
            )}

            {so.materials && (
              <div className="pt-2">
                <div className="text-white/60">Materiais</div>
                <div className="mt-1 rounded-xl border border-white/10 bg-white/5 p-3">
                  {so.materials}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Valores */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur">
          <div className="text-sm font-medium">Valores</div>

          <div className="mt-3 space-y-2 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Mão de obra</span>
              <span className="font-medium">{moneyBRL(so.laborCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Total</span>
              <span className="font-medium">{moneyBRL(so.totalCents)}</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Dica: use “Editar” para alterar técnico, materiais, status e
            valores.
          </div>
        </div>
      </div>
    </div>
  );
}
