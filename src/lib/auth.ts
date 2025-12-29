import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type TokenPayload = {
  sub: string;
  role: "ADMIN" | "TECH" | "CUSTOMER";
  name: string;
};

const COOKIE_NAME = "msh_token";

/* =========================
   TOKEN
========================= */

export function signToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies(); // ✅ Next 16 precisa await
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies(); // ✅ Next 16 precisa await
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/* =========================
   SESSÃO
========================= */

export async function getAuth(): Promise<TokenPayload | null> {
  const cookieStore = await cookies(); // ✅ Next 16 precisa await
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

/* =========================
   GUARDS
========================= */

export async function requireAuth(): Promise<TokenPayload> {
  const user = await getAuth();

  if (!user) {
    // ✅ em route handler, "throw NextResponse" funciona bem
    throw NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  return user;
}

export async function requireAdmin(): Promise<TokenPayload> {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw NextResponse.json(
      { error: "Acesso restrito a administradores" },
      { status: 403 }
    );
  }

  return user;
}

export async function requireRole(
  roles: Array<TokenPayload["role"]>
): Promise<TokenPayload> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw NextResponse.json(
      { error: "Permissão insuficiente" },
      { status: 403 }
    );
  }

  return user;
}
