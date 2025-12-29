export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ e?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const e = sp.e;

  const errorMsg =
    e === "1"
      ? "Informe e-mail e senha."
      : e === "2"
      ? "Credenciais inválidas."
      : e === "3"
      ? "Configuração inválida do servidor."
      : e === "500"
      ? "Erro inesperado. Tente novamente."
      : null;

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-neutral-950 text-white">
      {/* Glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-48 -left-48 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-24 -right-48 h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-[-260px] left-1/3 h-[640px] w-[640px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Painel Administrativo
          </div>
          <h1 className="mt-1 text-2xl font-semibold">MSH Hidráulica</h1>
          <p className="mt-1 text-sm text-white/60">
            Acesse com suas credenciais
          </p>
        </div>

        <form action="/api/auth/login" method="post" className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">E-mail</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">Senha</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} MSH Hidráulica
        </div>
      </div>
    </main>
  );
}
