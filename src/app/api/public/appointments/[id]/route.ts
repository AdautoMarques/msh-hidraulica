import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// overlap de intervalos [a,b) e [c,d)
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function GET(req: Request) {
  // ✅ pega o id direto da URL (mais estável no Next 16)
  const u = new URL(req.url);
  const id = u.pathname.split("/").pop() || "";

  if (!id || id.length < 10) {
    return json({ error: "ID inválido." }, 400);
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      service: {
        select: { id: true, name: true, durationMin: true, basePrice: true },
      },
      customer: {
        select: { id: true, name: true, phone: true, email: true },
      },
    },
  });

  if (!appt) return json({ error: "Agendamento não encontrado." }, 404);

  return json({ appointment: appt });
}

/**
 * PATCH -> cancela agendamento
 * regras:
 * - só pode cancelar se estiver PENDING ou CONFIRMED
 */
export async function PATCH(req: Request) {
  const u = new URL(req.url);
  const id = u.pathname.split("/").pop() || "";

  if (!id || id.length < 10) {
    return json({ error: "ID inválido." }, 400);
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "");

  if (action !== "cancel") {
    return json({ error: "Ação inválida." }, 400);
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true, startAt: true, endAt: true },
  });

  if (!appt) return json({ error: "Agendamento não encontrado." }, 404);

  const st = appt.status;
  if (st === "CANCELED") return json({ error: "Já está cancelado." }, 400);
  if (st === "DONE") return json({ error: "Já foi concluído." }, 400);
  if (st === "NO_SHOW")
    return json({ error: "Marcado como não compareceu." }, 400);

  if (!(st === "PENDING" || st === "CONFIRMED")) {
    return json({ error: "Não é possível cancelar neste status." }, 400);
  }

  // ✅ (opcional) garante que não está em timeoff (não precisa pra cancelar)
  // deixei sem, pra não atrapalhar.

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELED" },
    select: { id: true, status: true },
  });

  return json({ ok: true, appointment: updated });
}
