export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as string | undefined;

  if (!status) {
    return NextResponse.json(
      { error: "status é obrigatório" },
      { status: 400 }
    );
  }

  const allowed = ["PENDING", "CONFIRMED", "CANCELED", "DONE", "NO_SHOW"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: status as any },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, updated });
}
