export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Action = "confirm" | "cancel" | "done";

async function nextServiceOrderNumber() {
  // pega o maior number e soma 1
  const last = await prisma.serviceOrder.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action as Action | undefined;

  if (!action) {
    return NextResponse.json(
      { error: "action é obrigatório" },
      { status: 400 }
    );
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      startAt: true,
      endAt: true,
      notes: true,
      customerId: true,
      serviceId: true,
      customer: { select: { name: true, phone: true, address: true } },
      service: { select: { name: true, description: true, basePrice: true } },
      serviceOrder: { select: { id: true } },
    },
  });

  if (!appt) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  if (action === "cancel") {
    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "done") {
    await prisma.appointment.update({
      where: { id },
      data: { status: "DONE" },
    });

    // se tiver OS vinculada, também marca como DONE
    if (appt.serviceOrder?.id) {
      await prisma.serviceOrder.update({
        where: { id: appt.serviceOrder.id },
        data: { status: "DONE" },
      });
    }

    return NextResponse.json({ ok: true });
  }

  // action === "confirm"
  // confirma e cria OS se ainda não existir
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CONFIRMED" },
    select: { id: true, status: true },
  });

  if (appt.serviceOrder?.id) {
    return NextResponse.json({
      ok: true,
      appointment: updated,
      serviceOrderCreated: false,
    });
  }

  const number = await nextServiceOrderNumber();

  const createdOS = await prisma.serviceOrder.create({
    data: {
      number,
      status: "OPEN",
      customerId: appt.customerId,
      appointmentId: appt.id,
      title: appt.service.name,
      description:
        [
          appt.service.description
            ? `Serviço: ${appt.service.description}`
            : null,
          appt.customer?.address ? `Endereço: ${appt.customer.address}` : null,
          appt.notes ? `Obs: ${appt.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n") || null,
      laborCents: appt.service.basePrice ?? 0,
      totalCents: appt.service.basePrice ?? 0,
    },
    select: { id: true, number: true, status: true },
  });

  return NextResponse.json({
    ok: true,
    appointment: updated,
    serviceOrderCreated: true,
    serviceOrder: createdOS,
  });
}
