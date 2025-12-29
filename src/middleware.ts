import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Só protege rotas /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Lê o cookie DIRETAMENTE
  const token = req.cookies.get("msh_token")?.value;

  // ❌ Sem cookie → login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Com cookie → deixa passar (NÃO valida JWT aqui)
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
