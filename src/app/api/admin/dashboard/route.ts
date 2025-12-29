export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [
    appointmentsToday,
    openWorkOrders,
    invoicesThisMonth,
    nextAppointments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        startAt: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELED" },
      },
    }),

    prisma.serviceOrder.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_PARTS"] },
      },
    }),

    prisma.invoice.count({
      where: {
        createdAt: { gte: monthStart },
        status: { not: "CANCELED" },
      },
    }),

    prisma.appointment.findMany({
      where: {
        startAt: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { startAt: "asc" },
      take: 5,
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    appointmentsToday,
    openWorkOrders,
    invoicesThisMonth,
    nextAppointments: nextAppointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      endAt: a.endAt,
      status: a.status,
      clientName: a.customer?.name ?? "Cliente",
      clientPhone: a.customer?.phone ?? null,
      serviceName: a.service?.name ?? "Serviço",
    })),
  });
}
