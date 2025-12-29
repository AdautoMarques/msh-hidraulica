import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN")
    return json({ error: "Não autorizado." }, 401);

  const body = await req.json().catch(() => ({}));
  const appointmentId = String(body?.appointmentId ?? "").trim();
  if (!appointmentId)
    return json({ error: "appointmentId é obrigatório." }, 400);

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, service: true, serviceOrder: true },
  });

  if (!appt) return json({ error: "Agendamento não encontrado." }, 404);

  // Se já tem OS, devolve ela
  if (appt.serviceOrder) {
    return json(
      { serviceOrderId: appt.serviceOrder.id, alreadyExisted: true },
      200
    );
  }

  // Se quiser travar pra só CONFIRMED, descomenta:
  if (appt.status !== "CONFIRMED") {
    return json(
      {
        error:
          "Só é possível gerar OS quando o agendamento estiver CONFIRMADO.",
      },
      400
    );
  }

  // gera número sequencial simples (OK pra começo)
  const last = await prisma.serviceOrder.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const nextNumber = (last?.number ?? 0) + 1;

  const title = `${appt.service.name} • ${appt.customer.name}`;
  const description = appt.notes ? `Obs do agendamento: ${appt.notes}` : null;

  const so = await prisma.serviceOrder.create({
    data: {
      number: nextNumber,
      status: "OPEN",
      customerId: appt.customerId,
      appointmentId: appt.id,
      title,
      description,
      // technician fica null/undefined no schema atual (string?)
      laborCents: 0,
      totalCents: 0,
    },
    select: { id: true },
  });

  return json({ serviceOrderId: so.id, alreadyExisted: false }, 201);
}
