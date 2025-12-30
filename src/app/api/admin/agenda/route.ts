import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  // intervalos [start, end)
  return aStart < bEnd && bStart < aEnd;
}

function parseDayParam(day: string | null) {
  // espera YYYY-MM-DD
  if (!day) return null;
  const [y, m, d] = day.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

async function getBusinessHours() {
  return prisma.businessHours.findMany({
    where: { active: true },
    orderBy: { weekday: "asc" },
    select: { weekday: true, startMin: true, endMin: true },
  });
}

async function getTimeOff(rangeStart: Date, rangeEnd: Date) {
  return prisma.timeOff.findMany({
    where: {
      OR: [
        { startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } }, // overlap
      ],
    },
    select: { id: true, startAt: true, endAt: true, reason: true },
    orderBy: { startAt: "asc" },
  });
}

async function getAppointments(rangeStart: Date, rangeEnd: Date) {
  return prisma.appointment.findMany({
    where: {
      startAt: { gte: rangeStart, lte: rangeEnd },
      status: { not: "CANCELED" },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true, durationMin: true } },
      serviceOrder: { select: { id: true, number: true } },
    },
    orderBy: { startAt: "asc" },
  });
}

type TimeOffRow = Awaited<ReturnType<typeof getTimeOff>>[number];
type ApptRow = Awaited<ReturnType<typeof getAppointments>>[number];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const dayStr = url.searchParams.get("day"); // YYYY-MM-DD
    const stepMinRaw = Number(url.searchParams.get("stepMin") ?? "30");
    const stepMin = clamp(
      Number.isFinite(stepMinRaw) ? stepMinRaw : 30,
      10,
      120
    );

    const day = parseDayParam(dayStr) ?? new Date();
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const weekday = dayStart.getDay(); // 0..6

    const businessHours = await getBusinessHours();
    const todays = businessHours.find((b) => b.weekday === weekday);

    // Se não tem horário ativo nesse dia, retorna vazio (sem slots)
    if (!todays) {
      return NextResponse.json({
        day: dayStr ?? dayStart.toISOString().slice(0, 10),
        weekday,
        stepMin,
        open: false,
        slots: [],
        appointments: [],
        businessHours,
      });
    }

    const rangeStart = new Date(dayStart);
    const rangeEnd = new Date(dayEnd);

    const [timeOff, appts] = await Promise.all([
      getTimeOff(rangeStart, rangeEnd),
      getAppointments(rangeStart, rangeEnd),
    ]);

    // Monta slots do dia no intervalo do businessHours
    const slots: Array<{
      startAt: string;
      endAt: string;
      available: boolean;
      reason?: string;
    }> = [];

    const openStart = new Date(dayStart);
    openStart.setMinutes(todays.startMin, 0, 0);

    const openEnd = new Date(dayStart);
    openEnd.setMinutes(todays.endMin, 0, 0);

    // segurança caso end < start
    if (openEnd <= openStart) {
      return NextResponse.json({
        day: dayStr ?? dayStart.toISOString().slice(0, 10),
        weekday,
        stepMin,
        open: false,
        slots: [],
        appointments: appts,
        businessHours,
      });
    }

    for (
      let t = new Date(openStart);
      t < openEnd;
      t = new Date(t.getTime() + stepMin * 60 * 1000)
    ) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t.getTime() + stepMin * 60 * 1000);
      if (slotEnd > openEnd) break;

      // TIME OFF?
      const isTimeOff = (timeOff as TimeOffRow[]).some((off: TimeOffRow) =>
        overlaps(slotStart, slotEnd, off.startAt, off.endAt)
      );

      // APPOINTMENT?
      const isBooked = (appts as ApptRow[]).some((a: ApptRow) => {
        const aStart = a.startAt;
        const aEnd =
          a.endAt ??
          new Date(
            a.startAt.getTime() + (a.service?.durationMin ?? 60) * 60 * 1000
          );
        return overlaps(slotStart, slotEnd, aStart, aEnd);
      });

      const available = !isTimeOff && !isBooked;

      const offReason = !available
        ? (timeOff as TimeOffRow[]).find((off: TimeOffRow) =>
            overlaps(slotStart, slotEnd, off.startAt, off.endAt)
          )?.reason ?? undefined
        : undefined;

      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        available,
        ...(offReason ? { reason: offReason } : {}),
      });
    }

    return NextResponse.json({
      day: dayStr ?? dayStart.toISOString().slice(0, 10),
      weekday,
      stepMin,
      open: true,
      slots,
      appointments: appts,
      businessHours,
      timeOff,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Erro ao carregar agenda.",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
