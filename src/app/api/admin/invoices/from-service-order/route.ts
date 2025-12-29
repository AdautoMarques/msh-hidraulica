import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const serviceOrderId = String(body.serviceOrderId ?? "").trim();

    if (!serviceOrderId) {
      return NextResponse.json(
        { error: "serviceOrderId é obrigatório" },
        { status: 400 }
      );
    }

    // 1) Busca OS + cliente + invoice (se existir)
    const so = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: { customer: true, invoice: true },
    });

    if (!so) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    // 2) Se já tem nota ligada, devolve ela
    if (so.invoice) {
      return NextResponse.json(so.invoice, { status: 200 });
    }

    // 3) Próximo número de nota
    const last = await prisma.invoice.findFirst({
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextNumber = (last?.number ?? 0) + 1;

    const subtotal = so.totalCents ?? 0;

    // 4) Cria nota + 1 item + link com OS (tudo numa tacada)
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
      include: { items: true },
    });

    // 5) Marca OS como DONE (opcional, mas faz sentido)
    await prisma.serviceOrder.update({
      where: { id: so.id },
      data: { status: "DONE" },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar nota" }, { status: 500 });
  }
}
