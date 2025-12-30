// src/app/api/admin/agenda/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TZ_OFFSET = "-03:00"; // São Paulo

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function dayBoundsLocal(dayISO: string) {
  // dayISO = "YYYY-MM-DD"
  const start = new Date(`${dayISO}T00:00:00.000${TZ_OFFSET}`);
  const end = new Date(`${dayISO}T23:59:59.999${TZ_OFFSET}`);
  return { start, end };
}

function weekdayLocal(dayISO: string) {
  const d = new Date(`${dayISO}T12:00:00.000${TZ_OFFSET}`); // meio-dia evita bug de DST
  // JS: 0=Dom ... 6=Sáb
  return d.getDay();
}

async function getBusinessHours() {
  return prisma.businessHours.findMany({
    where: { active: true },
    orderBy: { weekday: "asc" },
  });
}

type BHRow = Awaited<ReturnType<typeof getBusinessHours>>[number];

async function getTimeOff(rangeStart: Date, rangeEnd: Date) {
  return prisma.timeOff.findMany({
    where: {
      // pega qualquer folga que intersecte o dia
      startAt: { lte: rangeEnd },
      endAt: { gte: rangeStart },
    },
    orderBy: { startAt: "asc" },
  });
}

type TimeOffRow = Awaited<ReturnType<typeof getTimeOff>>[number];

async function getAppointments(rangeStart: Date, rangeEnd: Date) {
  return prisma.appointment.findMany({
    where: {
      startAt: { gte: rangeStart, lte: rangeEnd },
      // se quiser esconder cancelados:
      // status: { notIn: ["CANCELED", "NO_SHOW"] as any },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true, durationMin: true } },
    },
    orderBy: { startAt: "asc" },
  });
}

type AppointmentRow = Awaited<ReturnType<typeof getAppointments>>[number];

function toMinOfDayLocal(date: Date) {
  // converte Date -> minutos no dia em horário local (-03)
  // A forma mais estável aqui é usar "Intl" com timeZone, mas pra manter simples
  // e consistente no serverless, a gente calcula com base no "day start" que já está em -03.
  // Então esse helper só é usado quando precisamos comparar com dayStart (também em -03).
  return date.getHours() * 60 + date.getMinutes();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const day = (searchParams.get("day") ?? "").trim(); // YYYY-MM-DD
    if (!day) {
      return NextResponse.json(
        { error: "Parâmetro obrigatório: day=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const stepMinRaw = parseIntSafe(searchParams.get("stepMin"), 30);
    const stepMin = clamp(stepMinRaw, 5, 240);

    const { start: dayStart, end: dayEnd } = dayBoundsLocal(day);
    const weekday = weekdayLocal(day);

    const businessHours: BHRow[] = await getBusinessHours();
    const todays = businessHours.find((b) => b.weekday === weekday) ?? null;

    // Se não tem horário pro dia, devolve sem slots
    if (!todays) {
      return NextResponse.json({
        day,
        weekday,
        stepMin,
        todays: null,
        slots: [],
        appointments: [],
        timeOff: [],
      });
    }

    const [timeOff, appointments] = await Promise.all([
      getTimeOff(dayStart, dayEnd),
      getAppointments(dayStart, dayEnd),
    ]);

    // Monta slots
    const slots: Array<{
      startAt: string;
      endAt: string;
      available: boolean;
      reason?: "TIME_OFF" | "BOOKED";
      appointmentId?: string;
      customerName?: string;
      serviceName?: string;
      status?: string;
    }> = [];

    const startMin = clamp(todays.startMin, 0, 24 * 60);
    const endMin = clamp(todays.endMin, 0, 24 * 60);

    // segurança
    if (endMin <= startMin) {
      return NextResponse.json({
        day,
        weekday,
        stepMin,
        todays,
        slots: [],
        appointments,
        timeOff,
        warning: "BusinessHours inválido: endMin <= startMin",
      });
    }

    for (let m = startMin; m + stepMin <= endMin; m += stepMin) {
      const slotStart = new Date(dayStart.getTime() + m * 60_000);
      const slotEnd = new Date(dayStart.getTime() + (m + stepMin) * 60_000);

      // TIME OFF?
      const isTimeOff = (timeOff as TimeOffRow[]).some((off: TimeOffRow) =>
        overlaps(slotStart, slotEnd, off.startAt, off.endAt)
      );

      if (isTimeOff) {
        slots.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          available: false,
          reason: "TIME_OFF",
        });
        continue;
      }

      // AGENDADO?
      const appt = (appointments as AppointmentRow[]).find(
        (a: AppointmentRow) => overlaps(slotStart, slotEnd, a.startAt, a.endAt)
      );

      if (appt) {
        slots.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          available: false,
          reason: "BOOKED",
          appointmentId: appt.id,
          customerName: appt.customer?.name ?? undefined,
          serviceName: appt.service?.name ?? undefined,
          status: appt.status,
        });
        continue;
      }

      // LIVRE
      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        available: true,
      });
    }

    return NextResponse.json({
      day,
      weekday,
      stepMin,
      todays,
      slots,
      appointments: appointments.map((a: AppointmentRow) => ({
        id: a.id,
        startAt: a.startAt.toISOString(),
        endAt: a.endAt.toISOString(),
        status: a.status,
        notes: a.notes ?? null,
        customer: {
          name: a.customer?.name ?? null,
          phone: a.customer?.phone ?? null,
        },
        service: {
          name: a.service?.name ?? null,
          durationMin: a.service?.durationMin ?? null,
        },
      })),
      timeOff: timeOff.map((t: TimeOffRow) => ({
        id: t.id,
        startAt: t.startAt.toISOString(),
        endAt: t.endAt.toISOString(),
        reason: t.reason ?? null,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao montar agenda.", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
