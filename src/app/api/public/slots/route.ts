import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function startOfDayISO(dayStr: string) {
  // dayStr: "YYYY-MM-DD"
  const d = new Date(`${dayStr}T00:00:00.000-03:00`); // Brasil
  // ⚠️ se seu server não estiver -03, isso ajuda a evitar shift
  return d;
}

function addMinutes(d: Date, min: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + min);
  return x;
}

// overlap de intervalos [a,b) e [c,d)
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const day = u.searchParams.get("day") || "";
  const serviceId = u.searchParams.get("serviceId") || "";

  if (!day) return json({ error: "day é obrigatório" }, 400);
  if (!serviceId) return json({ error: "serviceId é obrigatório" }, 400);

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, durationMin: true, active: true },
  });

  if (!service || !service.active) {
    return json({ error: "Serviço inválido/inativo" }, 400);
  }

  const durationMin = service.durationMin || 60;
  const dayStart = startOfDayISO(day);

  // weekday 0..6
  const weekday = dayStart.getDay();

  // horário comercial desse dia
  const bh = await prisma.businessHours.findUnique({
    where: { weekday },
    select: { startMin: true, endMin: true, active: true },
  });

  if (!bh || !bh.active) {
    return json({ slots: [] });
  }

  // janela do dia
  const openAt = addMinutes(dayStart, bh.startMin);
  const closeAt = addMinutes(dayStart, bh.endMin);

  // timeoffs que encostam nesse dia
  const timeOffs = await prisma.timeOff.findMany({
    where: {
      startAt: { lt: closeAt },
      endAt: { gt: openAt },
    },
    select: { startAt: true, endAt: true },
  });

  // agendamentos do dia (exceto cancelados)
  const appts = await prisma.appointment.findMany({
    where: {
      status: { not: "CANCELED" },
      startAt: { lt: closeAt },
      endAt: { gt: openAt },
    },
    select: { startAt: true, endAt: true },
  });

  // Gera slots: passo = durationMin
  const slots: Array<{
    startAt: string;
    endAt: string;
    free: boolean;
    reason?: "BOOKED" | "TIME_OFF";
  }> = [];

  // importante: o último start precisa caber duração antes de closeAt
  for (
    let cur = new Date(openAt);
    addMinutes(cur, durationMin) <= closeAt;
    cur = addMinutes(cur, durationMin)
  ) {
    const end = addMinutes(cur, durationMin);

    const blockedByTimeOff = timeOffs.some((t) =>
      overlaps(cur, end, t.startAt, t.endAt)
    );

    if (blockedByTimeOff) {
      slots.push({
        startAt: cur.toISOString(),
        endAt: end.toISOString(),
        free: false,
        reason: "TIME_OFF",
      });
      continue;
    }

    const booked = appts.some((a) => overlaps(cur, end, a.startAt, a.endAt));

    slots.push({
      startAt: cur.toISOString(),
      endAt: end.toISOString(),
      free: !booked,
      reason: booked ? "BOOKED" : undefined,
    });
  }

  return json({ slots, durationMin });
}
