import { prisma } from "./prisma";

function addMinutes(d: Date, min: number) {
  return new Date(d.getTime() + min * 60000);
}

function sameDayRange(dateISO: string) {
  const d = new Date(dateISO);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end, weekday: start.getDay() };
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function getAvailableSlots(dateISO: string, serviceId: string) {
  const { start, end, weekday } = sameDayRange(dateISO);

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return [];

  const hours = await prisma.businessHours.findUnique({ where: { weekday } });
  if (!hours || !hours.active) return [];

  const timeOff = await prisma.timeOff.findMany({
    where: { OR: [{ startAt: { lte: end }, endAt: { gte: start } }] },
  });

  const busy = await prisma.appointment.findMany({
    where: {
      startAt: { gte: start, lte: end },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { startAt: true, endAt: true },
  });

  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);

  let cursor = addMinutes(dayStart, hours.startMin);
  const dayEnd = addMinutes(dayStart, hours.endMin);

  const step = 30; // granularidade
  const slots: { startAt: Date; endAt: Date }[] = [];

  while (cursor < dayEnd) {
    const slotStart = cursor;
    const slotEnd = addMinutes(slotStart, service.durationMin);

    if (slotEnd > dayEnd) break;

    const isInTimeOff = timeOff.some((t) =>
      overlaps(slotStart, slotEnd, t.startAt, t.endAt)
    );
    const isBusy = busy.some((b) =>
      overlaps(slotStart, slotEnd, b.startAt, b.endAt)
    );

    if (!isInTimeOff && !isBusy) {
      slots.push({ startAt: slotStart, endAt: slotEnd });
    }

    cursor = addMinutes(cursor, step);
  }

  return slots;
}
