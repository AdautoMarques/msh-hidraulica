import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return json({ services });
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const description = body?.description ? String(body.description) : null;
  const durationMin = Number(body?.durationMin ?? 60);
  const basePrice = Number(body?.basePrice ?? 0);
  const active = body?.active === false ? false : true;

  if (name.length < 2) return json({ error: "Nome inválido." }, 400);
  if (!Number.isFinite(durationMin) || durationMin < 15)
    return json({ error: "Duração inválida." }, 400);

  const created = await prisma.service.create({
    data: { name, description, durationMin, basePrice, active },
  });

  return json({ ok: true, service: created }, 201);
}
