export const runtime = "nodejs";

import { NextResponse } from "next/server";

const COOKIE_NAME = "msh_token";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
