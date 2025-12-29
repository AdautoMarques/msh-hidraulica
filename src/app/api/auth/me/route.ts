export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/msh_token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) return NextResponse.json({ ok: false, reason: "NO_COOKIE" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ ok: true, payload });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      reason: "BAD_TOKEN",
      message: e?.message,
    });
  }
}
