import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>; // ✅ Next 16
};

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    return NextResponse.json(
      { error: "Serviço não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(service);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const description =
    body.description === null || typeof body.description === "string"
      ? body.description
      : undefined;

  const durationMin =
    body.durationMin === undefined ? undefined : Number(body.durationMin);
  const basePrice =
    body.basePrice === undefined ? undefined : Number(body.basePrice);

  const active = body.active === undefined ? undefined : Boolean(body.active);

  // validações básicas
  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (
    durationMin !== undefined &&
    (!Number.isFinite(durationMin) || durationMin <= 0)
  ) {
    return NextResponse.json(
      { error: "durationMin inválido." },
      { status: 400 }
    );
  }
  if (
    basePrice !== undefined &&
    (!Number.isFinite(basePrice) || basePrice < 0)
  ) {
    return NextResponse.json({ error: "basePrice inválido." }, { status: 400 });
  }

  try {
    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(durationMin !== undefined ? { durationMin } : {}),
        ...(basePrice !== undefined ? { basePrice } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    // erro comum: nome duplicado (unique)
    const msg = String(err?.message ?? "");
    if (
      msg.toLowerCase().includes("unique") ||
      msg.toLowerCase().includes("duplicate")
    ) {
      return NextResponse.json(
        { error: "Já existe um serviço com esse nome." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar serviço." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir serviço." },
      { status: 500 }
    );
  }
}
