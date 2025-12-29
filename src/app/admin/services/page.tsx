"use client";

import { useEffect, useState } from "react";
import { Plus, Save, ToggleLeft, ToggleRight } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  basePrice: number;
  active: boolean;
};

function moneyBRL(cents: number) {
  return ((cents ?? 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminServicesPage() {
  const [list, setList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [basePrice, setBasePrice] = useState(15000);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/services", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setList(data?.services ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        durationMin,
        basePrice,
        active: true,
      }),
    });
    if (res.ok) {
      setName("");
      setDescription("");
      setDurationMin(60);
      setBasePrice(15000);
      load();
    }
  }

  async function patch(id: string, data: Partial<Service>) {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) load();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-white/60">Configurações</div>
        <h1 className="text-2xl font-semibold">Serviços</h1>
        <p className="text-sm text-white/60">
          Cadastre serviços, duração e valor base.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-sm font-medium mb-3 flex items-center gap-2">
          <Plus size={16} /> Novo serviço
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Ex: Visita técnica"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">Duração (min)</label>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-white/60">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">
              Preço base (centavos)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <div className="text-xs text-white/50">
              Prévia: {moneyBRL(basePrice)}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={create}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Criar serviço
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-sm font-medium mb-3">Lista</div>

        {loading ? (
          <div className="text-sm text-white/60">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-white/60">Nenhum serviço.</div>
        ) : (
          <div className="grid gap-3">
            {list.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-white/60">
                      {s.description ?? "—"}
                    </div>
                    <div className="mt-2 text-xs text-white/70">
                      {s.durationMin} min • {moneyBRL(s.basePrice)}
                    </div>
                  </div>

                  <button
                    onClick={() => patch(s.id, { active: !s.active })}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-black/40"
                  >
                    {s.active ? (
                      <ToggleRight size={18} />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                    {s.active ? "Ativo" : "Inativo"}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <input
                    defaultValue={s.name}
                    onBlur={(e) => patch(s.id, { name: e.target.value })}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    defaultValue={s.durationMin}
                    type="number"
                    onBlur={(e) =>
                      patch(s.id, { durationMin: Number(e.target.value) })
                    }
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    defaultValue={s.basePrice}
                    type="number"
                    onBlur={(e) =>
                      patch(s.id, { basePrice: Number(e.target.value) })
                    }
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-2 text-xs text-white/50">
                  * Alterações salvam ao sair do campo (blur)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
