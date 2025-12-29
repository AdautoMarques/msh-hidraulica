import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin();

  const id = params.id;
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body?.name !== undefined) data.name = String(body.name).trim();
  if (body?.description !== undefined)
    data.description = body.description ? String(body.description) : null;
  if (body?.durationMin !== undefined)
    data.durationMin = Number(body.durationMin);
  if (body?.basePrice !== undefined) data.basePrice = Number(body.basePrice);
  if (body?.active !== undefined) data.active = Boolean(body.active);

  const updated = await prisma.service.update({ where: { id }, data });
  return json({ ok: true, service: updated });
}
