import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const so = await prisma.serviceOrder.findUnique({ where: { id } });

    if (!so) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    return NextResponse.json(so);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar OS" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));

    // Sanitização simples
    const laborCents = Number(body.laborCents ?? 0);
    const totalCents = Number(body.totalCents ?? 0);

    if (!Number.isFinite(laborCents) || laborCents < 0) {
      return NextResponse.json(
        { error: "Mão de obra inválida" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(totalCents) || totalCents < 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    const so = await prisma.serviceOrder.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title : undefined,
        description:
          body.description === null || typeof body.description === "string"
            ? body.description
            : undefined,
        status: typeof body.status === "string" ? body.status : undefined,
        technician:
          body.technician === null || typeof body.technician === "string"
            ? body.technician
            : undefined,
        materials:
          body.materials === null || typeof body.materials === "string"
            ? body.materials
            : undefined,
        laborCents,
        totalCents,
      },
    });

    return NextResponse.json(so);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao atualizar OS" },
      { status: 500 }
    );
  }
}
