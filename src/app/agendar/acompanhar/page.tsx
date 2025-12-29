import { Suspense } from "react";
import AcompanharClient from "./AcompanharClient";

export const dynamic = "force-dynamic"; // evita tentar SSG/Static
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white/70">
            Carregando...
          </div>
        </main>
      }
    >
      <AcompanharClient />
    </Suspense>
  );
}
