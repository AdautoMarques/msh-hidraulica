import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "msh_token";

/** auth compatível com Next 16 (cookies() pode ser Promise no TS) */
async function authOrThrow() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) throw new Error("UNAUTHORIZED");
  jwt.verify(token, process.env.JWT_SECRET!);
}

/** "08:30" -> 510 */
function hhmmToMin(hhmm: string) {
  const [hStr, mStr] = String(hhmm ?? "").split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(23 * 60 + 59, h * 60 + m));
}

/** 510 -> "08:30" */
function minToHHMM(min: number) {
  const v = Math.max(0, Math.min(23 * 60 + 59, Number(min) || 0));
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Formato que a UI normalmente usa */
type BusinessHourDTO = {
  weekday: number; // 0=dom ... 6=sab
  active: boolean;
  start: string; // "08:00"
  end: string;   // "17:00"
};

/** GET: retorna em formato amigável (start/end em HH:MM) */
export async function GET() {
  try {
    await authOrThrow();

    const rows = await prisma.businessHours.findMany({
      orderBy: { weekday: "asc" }, // ✅ CORRETO pro seu schema
    });

    const data: BusinessHourDTO[] = rows.map((r) => ({
      weekday: r.weekday,
      active: r.active,
      start: minToHHMM(r.startMin),
      end: minToHHMM(r.endMin),
    }));

    return NextResponse.json(data);
  } catch (e: any) {
    if (String(e.message) === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET business-hours error:", e);
    return NextResponse.json(
      { error: "Failed to load business hours" },
      { status: 500 }
    );
  }
}

/**
 * PUT: recebe:
 * [
 *   { weekday: 1, active: true, start: "08:00", end: "17:00" },
 *   ...
 * ]
 */
export async function PUT(req: Request) {
  try {
    await authOrThrow();

    const body = (await req.json()) as BusinessHourDTO[];

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // validação simples
    for (const row of body) {
      if (typeof row.weekday !== "number" || row.weekday < 0 || row.weekday > 6) {
        return NextResponse.json({ error: "weekday inválido" }, { status: 400 });
      }
      if (typeof row.active !== "boolean") {
        return NextResponse.json({ error: "active inválido" }, { status: 400 });
      }
      if (!row.start || !row.end) {
        return NextResponse.json({ error: "start/end obrigatórios" }, { status: 400 });
      }
    }

    await prisma.$transaction(
      body.map((row) => {
        const startMin = hhmmToMin(row.start);
        const endMin = hhmmToMin(row.end);

        return prisma.businessHours.upsert({
          where: { weekday: row.weekday }, // ✅ seu @@unique([weekday])
          update: {
            active: row.active,
            startMin,
            endMin,
          },
          create: {
            weekday: row.weekday,
            active: row.active,
            startMin,
            endMin,
          },
        });
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (String(e.message) === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT business-hours error:", e);
    return NextResponse.json(
      { error: "Failed to save business hours" },
      { status: 500 }
    );
  }
}
