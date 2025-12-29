export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// overlap de intervalos [a,b) e [c,d)
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function cleanPhone(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function isValidDate(d: any) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // ✅ Aceita exatamente o payload do seu front
    const serviceId = String(body?.serviceId ?? "").trim();
    const startAtRaw = body?.startAt;
    const endAtRaw = body?.endAt;

    const name = String(body?.name ?? "").trim();
    const phone = cleanPhone(body?.phone ?? "");
    const email =
      typeof body?.email === "string" && body.email.trim()
        ? body.email.trim()
        : null;
    const notes =
      typeof body?.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    // ✅ validações
    const missing: string[] = [];
    if (!serviceId) missing.push("serviceId");
    if (!startAtRaw) missing.push("startAt");
    if (!name) missing.push("name");
    if (!phone) missing.push("phone");

    if (missing.length) {
      return NextResponse.json(
        { error: `Dados obrigatórios não informados: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const startAt = new Date(startAtRaw);
    if (!isValidDate(startAt)) {
      return NextResponse.json({ error: "startAt inválido" }, { status: 400 });
    }

    // ✅ pega serviço (pra calcular endAt se necessário)
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, durationMin: true, active: true },
    });

    if (!service || !service.active) {
      return NextResponse.json(
        { error: "Serviço inválido ou inativo." },
        { status: 400 }
      );
    }

    // ✅ endAt: se vier inválido/vazio, calcula por durationMin
    let endAt = new Date(endAtRaw);
    if (!isValidDate(endAt)) {
      endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + (service.durationMin ?? 60));
    }

    if (endAt <= startAt) {
      return NextResponse.json(
        { error: "endAt inválido (deve ser maior que startAt)." },
        { status: 400 }
      );
    }

    // ✅ bloqueios por TimeOff
    const timeOffs = await prisma.timeOff.findMany({
      where: {
        OR: [
          { startAt: { lt: endAt }, endAt: { gt: startAt } }, // overlap
        ],
      },
      select: { startAt: true, endAt: true },
    });

    const blockedByTimeOff = timeOffs.some((t) =>
      overlaps(startAt, endAt, t.startAt, t.endAt)
    );

    if (blockedByTimeOff) {
      return NextResponse.json(
        { error: "Horário bloqueado (TimeOff)." },
        { status: 409 }
      );
    }

    // ✅ conflito com outro agendamento (ignora cancelados)
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: { not: "CANCELED" },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Horário já está ocupado." },
        { status: 409 }
      );
    }

    // ✅ acha/cria cliente:
    // - se tiver email, tenta reaproveitar por email (unique)
    // - se não tiver, cria um novo (porque phone NÃO é unique no schema)
    let customerId: string;

    if (email) {
      const existing = await prisma.customer.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        customerId = existing.id;

        // atualiza dados se quiser
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            name,
            phone,
          },
        });
      } else {
        const created = await prisma.customer.create({
          data: { name, email, phone },
          select: { id: true },
        });
        customerId = created.id;
      }
    } else {
      const created = await prisma.customer.create({
        data: { name, phone },
        select: { id: true },
      });
      customerId = created.id;
    }

    const appt = await prisma.appointment.create({
      data: {
        customerId,
        serviceId,
        startAt,
        endAt,
        status: "PENDING",
        notes,
      },
      select: { id: true },
    });

    return NextResponse.json({ appointmentId: appt.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar agendamento." },
      { status: 500 }
    );
  }
}
