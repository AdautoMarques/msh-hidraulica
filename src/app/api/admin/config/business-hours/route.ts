// src/app/api/admin/config/business-hours/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * DTO que o front usa (mais amigável)
 * start/end em "HH:MM"
 */
type BusinessHourDTO = {
  weekday: number; // 0=dom ... 6=sab
  active: boolean;
  start: string; // "08:00"
  end: string; // "17:00"
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function minToHHMM(min: number) {
  const m = Math.max(0, Math.min(24 * 60, Number(min) || 0));
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function hhmmToMin(v: string) {
  const s = String(v ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return 0;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  const total = hh * 60 + mm;
  return Math.max(0, Math.min(24 * 60, total));
}

// ✅ Tipagem segura do "row" vindo do Prisma (evita any)
type BusinessHoursRow = Awaited<
  ReturnType<typeof prisma.businessHours.findMany>
>[number];

export async function GET() {
  try {
    const rows: BusinessHoursRow[] = await prisma.businessHours.findMany({
      orderBy: { weekday: "asc" },
    });

    const data: BusinessHourDTO[] = rows.map((r: BusinessHoursRow) => ({
      weekday: r.weekday,
      active: r.active,
      start: minToHHMM(r.startMin),
      end: minToHHMM(r.endMin),
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Falha ao carregar horários.",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

/**
 * Atualiza TODOS os dias de uma vez (upsert por weekday)
 * Body:
 * { data: BusinessHourDTO[] }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      data?: BusinessHourDTO[];
    } | null;

    const incoming = body?.data;
    if (!Array.isArray(incoming)) {
      return NextResponse.json(
        { error: "Body inválido. Envie { data: BusinessHourDTO[] }" },
        { status: 400 }
      );
    }

    // valida e normaliza
    const normalized: Array<{
      weekday: number;
      active: boolean;
      startMin: number;
      endMin: number;
    }> = incoming.map((d) => {
      const weekday = Math.max(0, Math.min(6, Number(d.weekday) || 0));
      const active = Boolean(d.active);
      const startMin = hhmmToMin(d.start);
      const endMin = hhmmToMin(d.end);

      // segurança: se end <= start, mantém end = start+60 (mín 60min)
      const safeEnd =
        endMin <= startMin ? Math.min(24 * 60, startMin + 60) : endMin;

      return { weekday, active, startMin, endMin: safeEnd };
    });

    await prisma.$transaction(
      normalized.map((d) =>
        prisma.businessHours.upsert({
          where: { weekday: d.weekday },
          create: {
            weekday: d.weekday,
            active: d.active,
            startMin: d.startMin,
            endMin: d.endMin,
          },
          update: {
            active: d.active,
            startMin: d.startMin,
            endMin: d.endMin,
          },
        })
      )
    );

    // devolve atualizado
    const rows: BusinessHoursRow[] = await prisma.businessHours.findMany({
      orderBy: { weekday: "asc" },
    });

    const data: BusinessHourDTO[] = rows.map((r: BusinessHoursRow) => ({
      weekday: r.weekday,
      active: r.active,
      start: minToHHMM(r.startMin),
      end: minToHHMM(r.endMin),
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Falha ao salvar horários.",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
