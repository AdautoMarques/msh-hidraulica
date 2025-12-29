export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// helpers simples (sem depender de lib)
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
function toMinOfDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}
function withMin(baseDay: Date, minutes: number) {
  const x = new Date(baseDay);
  x.setHours(0, 0, 0, 0);
  x.setMinutes(minutes);
  return x;
}
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

type Slot = {
  startAt: string;
  endAt: string;
  free: boolean;
  reason?: "BOOKED" | "TIME_OFF";
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dayStr = url.searchParams.get("day"); // YYYY-MM-DD
  const stepMin = Number(url.searchParams.get("stepMin") ?? "30");

  const base = dayStr ? new Date(`${dayStr}T00:00:00`) : new Date();
  const from = startOfDay(base);
  const to = endOfDay(base);

  const weekday = from.getDay(); // 0 dom ... 6 sab

  // 1) BusinessHours do dia
  const bh = await prisma.businessHours.findUnique({
    where: { weekday },
    select: { active: true, startMin: true, endMin: true },
  });

  // Sem horário ativo => sem slots
  if (!bh || !bh.active) {
    return NextResponse.json({ slots: [], appointments: [] });
  }

  // 2) TimeOff (bloqueios)
  const timeOff = await prisma.timeOff.findMany({
    where: {
      // pega qualquer timeOff que toque no dia
      startAt: { lte: to },
      endAt: { gte: from },
    },
    select: { startAt: true, endAt: true },
  });

  // 3) Appointments do dia (AQUI ESTÁ O PULO DO GATO)
  // ✅ pega todos do dia, exceto cancelado
  const appts = await prisma.appointment.findMany({
    where: {
      startAt: { gte: from, lte: to },
      status: { not: "CANCELED" },
    },
    orderBy: { startAt: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true, durationMin: true } },
    },
  });

  // 4) Monta slots (range baseado no BusinessHours)
  const slots: Slot[] = [];
  const dayStart = withMin(from, bh.startMin);
  const dayEnd = withMin(from, bh.endMin);

  // Gera slots no passo stepMin
  for (
    let t = new Date(dayStart);
    t < dayEnd;
    t = new Date(t.getTime() + stepMin * 60 * 1000)
  ) {
    const slotStart = new Date(t);
    const slotEnd = new Date(t.getTime() + stepMin * 60 * 1000);
    if (slotEnd > dayEnd) break;

    // TIME_OFF?
    const isTimeOff = timeOff.some((off) =>
      overlaps(slotStart, slotEnd, off.startAt, off.endAt)
    );

    if (isTimeOff) {
      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        free: false,
        reason: "TIME_OFF",
      });
      continue;
    }

    // BOOKED?
    const booked = appts.some((a) =>
      overlaps(slotStart, slotEnd, a.startAt, a.endAt)
    );
    if (booked) {
      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        free: false,
        reason: "BOOKED",
      });
      continue;
    }

    // LIVRE
    slots.push({
      startAt: slotStart.toISOString(),
      endAt: slotEnd.toISOString(),
      free: true,
    });
  }

  // 5) Mapeia appointments para o formato que a UI espera
  const appointments = appts.map((a) => ({
    id: a.id,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    status: a.status,
    notes: a.notes ?? null,
    clientName: a.customer?.name ?? "—",
    clientPhone: a.customer?.phone ?? null,
    serviceName: a.service?.name ?? "—",
    durationMin: a.service?.durationMin ?? null,
  }));

  return NextResponse.json({ slots, appointments });
}
