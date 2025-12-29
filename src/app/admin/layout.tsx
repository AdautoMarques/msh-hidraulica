import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Receipt,
  Settings,
  LogOut,
  Wrench, // ✅ ícone de Serviços
} from "lucide-react";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "msh_token";

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
    >
      <span className="text-white/70">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/login");

  let payload: any = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    redirect("/login");
  }

  return (
    // ✅ app shell trava no tamanho da tela
    <div className="h-screen w-screen overflow-hidden bg-neutral-950 text-white">
      {/* Glow background cobrindo sempre a viewport */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-48 -left-48 h-[620px] w-[620px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute top-32 -right-48 h-[620px] w-[620px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-260px] left-1/3 h-[720px] w-[720px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
      </div>

      <div className="flex h-screen w-screen">
        {/* Sidebar fixa */}
        <aside className="w-[280px] border-r border-white/10 bg-black/30 backdrop-blur-xl flex flex-col">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/60">Painel</div>
                <div className="text-lg font-semibold tracking-tight">
                  MSH Hidráulica
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10" />
            </div>

            <div className="mt-6 space-y-1">
              <NavItem
                href="/admin"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
              />
              <NavItem
                href="/admin/agenda"
                icon={<CalendarDays size={18} />}
                label="Agenda"
              />
              <NavItem
                href="/admin/clientes"
                icon={<Users size={18} />}
                label="Clientes"
              />

              {/* ✅ NOVO: Serviços */}
              <NavItem
                href="/admin/services"
                icon={<Wrench size={18} />}
                label="Serviços"
              />

              <NavItem
                href="/admin/os"
                icon={<ClipboardList size={18} />}
                label="Ordens de Serviço"
              />
              <NavItem
                href="/admin/notas"
                icon={<Receipt size={18} />}
                label="Notas/Faturas"
              />
              <NavItem
                href="/admin/config"
                icon={<Settings size={18} />}
                label="Configurações"
              />
            </div>
          </div>

          <div className="mt-auto p-5 border-t border-white/10">
            <form action="/api/auth/logout" method="post">
              <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                <LogOut size={18} />
                Sair
              </button>
            </form>

            <div className="mt-3 text-xs text-white/50">
              Logado como{" "}
              <span className="text-white/80">
                {payload?.name ?? "Usuário"}
              </span>
            </div>
          </div>
        </aside>

        {/* Área direita: header fixo + conteúdo com scroll */}
        <div className="flex-1 flex h-screen flex-col">
          <header className="shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-xs text-white/60">Admin</div>
                <div className="text-sm text-white/85">
                  {payload?.role === "ADMIN" ? "Administrador" : "Técnico"}
                </div>
              </div>

              <Link href="/" className="text-sm text-white/60 hover:text-white">
                Ver site →
              </Link>
            </div>
          </header>

          {/* ✅ só o conteúdo rola (se precisar) */}
          <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
