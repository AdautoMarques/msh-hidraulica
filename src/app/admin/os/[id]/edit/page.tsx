"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type SO = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  technician: string | null;
  materials: string | null;
  laborCents: number;
  totalCents: number;
};

function parseMoneyToCents(v: string) {
  // aceita "123", "123.45", "123,45"
  const cleaned = String(v ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function centsToBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EditServiceOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [so, setSo] = useState<SO | null>(null);

  // inputs em BRL (texto) para não ficar brigando com cents
  const [laborBRL, setLaborBRL] = useState("0");
  const [totalBRL, setTotalBRL] = useState("0");

  // flag: se o usuário nunca mexeu no total, a gente auto-ajusta a partir da mão de obra
  const [totalTouched, setTotalTouched] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/service-orders/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      setError(`Não consegui carregar a OS. (${res.status}) ${txt}`);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as SO;

    setSo(data);
    setLaborBRL(String((data.laborCents ?? 0) / 100));
    setTotalBRL(String((data.totalCents ?? 0) / 100));
    setTotalTouched(false);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // auto-ajuste do total quando o usuário muda mão de obra (se ele não mexeu no total)
  useEffect(() => {
    if (!so) return;
    if (totalTouched) return;

    const laborCents = parseMoneyToCents(laborBRL);
    // regra simples: total acompanha mão de obra enquanto o usuário não editar total
    setTotalBRL(String(laborCents / 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laborBRL, totalTouched]);

  const laborCentsPreview = useMemo(
    () => parseMoneyToCents(laborBRL),
    [laborBRL]
  );
  const totalCentsPreview = useMemo(
    () => parseMoneyToCents(totalBRL),
    [totalBRL]
  );

  const canSave = useMemo(() => {
    if (!so) return false;
    if (!so.title?.trim()) return false;
    if (laborCentsPreview < 0 || totalCentsPreview < 0) return false;
    return true;
  }, [so, laborCentsPreview, totalCentsPreview]);

  async function save(next?: Partial<SO>, options?: { goBack?: boolean }) {
    if (!so) return;
    setSaving(true);
    setError(null);

    const merged: SO = { ...so, ...(next ?? {}) };

    const payload = {
      title: merged.title?.trim(),
      description: merged.description ?? null,
      status: merged.status,
      technician: merged.technician ?? null,
      materials: merged.materials ?? null,
      laborCents: parseMoneyToCents(laborBRL),
      totalCents: parseMoneyToCents(totalBRL),
    };

    if (!payload.title) {
      setError("O título é obrigatório.");
      setSaving(false);
      return;
    }

    if (payload.totalCents < 0 || payload.laborCents < 0) {
      setError("Valores não podem ser negativos.");
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/admin/service-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ?? `Erro ao salvar (${res.status}).`);
      setSaving(false);
      return;
    }

    const updated = (await res.json().catch(() => null)) as SO | null;
    if (updated) setSo(updated);

    setSaving(false);

    if (options?.goBack) {
      router.push(`/admin/os/${id}`);
      router.refresh();
    } else {
      // mantém na tela e recarrega dados do server (garante consistência)
      await load();
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/70">
        Carregando...
      </div>
    );
  }

  if (!so) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/70">
          {error ?? "OS não encontrada."}
        </div>
        <Link
          href="/admin/os"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Editar Ordem de Serviço</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            OS #{so.number}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Total atual:{" "}
            <span className="text-white/80">{centsToBRL(so.totalCents)}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/admin/os/${id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur space-y-4">
        <div>
          <div className="text-sm text-white/70">Título *</div>
          <input
            value={so.title ?? ""}
            onChange={(e) => setSo({ ...so, title: e.target.value })}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            placeholder="Ex: Troca de registro, vazamento, instalação..."
          />
        </div>

        <div>
          <div className="text-sm text-white/70">Descrição</div>
          <textarea
            value={so.description ?? ""}
            onChange={(e) => setSo({ ...so, description: e.target.value })}
            rows={4}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            placeholder="Detalhe o serviço..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-white/70">Status</div>
            <select
              value={so.status}
              onChange={(e) => setSo({ ...so, status: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            >
              <option value="OPEN">Em aberto</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluída</option>
              <option value="CANCELED">Cancelada</option>
            </select>
          </div>

          <div>
            <div className="text-sm text-white/70">Técnico</div>
            <input
              value={so.technician ?? ""}
              onChange={(e) => setSo({ ...so, technician: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
              placeholder="Nome do técnico"
            />
          </div>
        </div>

        <div>
          <div className="text-sm text-white/70">Materiais</div>
          <textarea
            value={so.materials ?? ""}
            onChange={(e) => setSo({ ...so, materials: e.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
            placeholder="Ex: 2x joelho 1/2, fita veda rosca, registro 3/4..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-white/70">Mão de obra (R$)</div>
            <input
              inputMode="decimal"
              value={laborBRL}
              onChange={(e) => setLaborBRL(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
              placeholder="Ex: 150"
            />
            <div className="mt-1 text-xs text-white/50">
              Prévia: {centsToBRL(laborCentsPreview)}
            </div>
          </div>

          <div>
            <div className="text-sm text-white/70">Total (R$)</div>
            <input
              inputMode="decimal"
              value={totalBRL}
              onChange={(e) => {
                setTotalTouched(true);
                setTotalBRL(e.target.value);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
              placeholder="Ex: 250"
            />
            <div className="mt-1 text-xs text-white/50">
              Prévia: {centsToBRL(totalCentsPreview)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => save(undefined, { goBack: false })}
            disabled={!canSave || saving}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>

          <button
            onClick={() => save(undefined, { goBack: true })}
            disabled={!canSave || saving}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 hover:bg-white/10 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar e voltar"}
          </button>

          <button
            onClick={() => save({ status: "DONE" }, { goBack: true })}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-5 py-3 text-sm text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-60"
          >
            ✅ Concluir
          </button>

          <button
            onClick={() => save({ status: "CANCELED" }, { goBack: true })}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/15 px-5 py-3 text-sm text-red-100 hover:bg-red-500/25 disabled:opacity-60"
          >
            ⛔ Cancelar
          </button>
        </div>

        <div className="mt-3 text-xs text-white/50">
          Dica: se você não mexer no Total, ele acompanha a mão de obra
          automaticamente. Se quiser um total diferente, edite o campo Total.
        </div>
      </div>
    </div>
  );
}
