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
function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const day = url.searchParams.get("day"); // YYYY-MM-DD
  const serviceId = url.searchParams.get("serviceId");
  const stepMinRaw = Number(url.searchParams.get("stepMin") ?? 15);

  const stepMin =
    Number.isFinite(stepMinRaw) && stepMinRaw > 0 ? stepMinRaw : 15;

  if (!day || !serviceId) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: day, serviceId" },
      { status: 400 }
    );
  }

  const base = new Date(`${day}T00:00:00`);
  const dayStart = startOfDay(base);
  const dayEnd = endOfDay(base);
  const weekday = dayStart.getDay();

  const [service, hours, timeOffs, appointments] = await Promise.all([
    prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true, durationMin: true, active: true },
    }),
    prisma.businessHours.findUnique({
      where: { weekday },
      select: { active: true, startMin: true, endMin: true },
    }),
    prisma.timeOff.findMany({
      where: { startAt: { lte: dayEnd }, endAt: { gte: dayStart } },
      select: { startAt: true, endAt: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        startAt: { lte: dayEnd },
        endAt: { gte: dayStart },
        status: { not: "CANCELED" },
      },
      select: { startAt: true, endAt: true },
      orderBy: { startAt: "asc" },
    }),
  ]);

  if (!service || !service.active) {
    return NextResponse.json({ day, serviceId, slots: [] });
  }
  if (!hours || !hours.active) {
    return NextResponse.json({ day, serviceId, slots: [] });
  }

  const durationMin = service.durationMin;

  const openStart = new Date(dayStart);
  openStart.setMinutes(hours.startMin, 0, 0);

  const openEnd = new Date(dayStart);
  openEnd.setMinutes(hours.endMin, 0, 0);

  const slots: Array<{ startAt: string; endAt: string }> = [];

  // vamos gerar possíveis "inícios" com stepMin, e cada slot dura durationMin
  for (let t = new Date(openStart); t < openEnd; t = addMinutes(t, stepMin)) {
    const end = addMinutes(t, durationMin);
    if (end > openEnd) break;

    const blocked = timeOffs.some((x) => overlaps(t, end, x.startAt, x.endAt));
    if (blocked) continue;

    const booked = appointments.some((a) =>
      overlaps(t, end, a.startAt, a.endAt)
    );
    if (booked) continue;

    slots.push({ startAt: t.toISOString(), endAt: end.toISOString() });
  }

  return NextResponse.json({
    day,
    service: { id: service.id, name: service.name, durationMin },
    slots,
  });
}
