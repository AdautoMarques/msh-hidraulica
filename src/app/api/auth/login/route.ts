export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "msh_token";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    if (!email || !password) {
      return NextResponse.redirect(new URL("/login?e=1", req.url), {
        status: 303,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.redirect(new URL("/login?e=2", req.url), {
        status: 303,
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.redirect(new URL("/login?e=2", req.url), {
        status: 303,
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL("/login?e=3", req.url), {
        status: 303,
      });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, name: user.name },
      secret,
      { expiresIn: "7d" }
    );

    // ✅ Redirect + cookie (jeito mais confiável)
    const res = NextResponse.redirect(new URL("/admin", req.url), {
      status: 303,
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // em dev fica false
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?e=500", req.url), {
      status: 303,
    });
  }
}
