"use client";

import { useEffect, useMemo, useState } from "react";

type BusinessHourDTO = {
  weekday: number; // 0=dom ... 6=sab
  active: boolean;
  start: string; // "08:00"
  end: string; // "17:00"
};

const WEEK = [
  { k: 0, label: "Dom" },
  { k: 1, label: "Seg" },
  { k: 2, label: "Ter" },
  { k: 3, label: "Qua" },
  { k: 4, label: "Qui" },
  { k: 5, label: "Sex" },
  { k: 6, label: "Sáb" },
];

function makeTimeOptions(stepMin = 30) {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMin) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}

const TIME_OPTIONS = makeTimeOptions(30);

function normalizeRows(rows: BusinessHourDTO[]) {
  // garante 7 linhas sempre
  const map = new Map<number, BusinessHourDTO>();
  rows.forEach((r) => map.set(r.weekday, r));

  return WEEK.map((d) => {
    const r = map.get(d.k);
    return (
      r ?? {
        weekday: d.k,
        active: d.k >= 1 && d.k <= 5, // padrão seg-sex ativo
        start: "08:00",
        end: "17:00",
      }
    );
  });
}

export default function AdminConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<BusinessHourDTO[]>([]);

  async function load() {
    setErr(null);
    setLoading(true);

    const res = await fetch("/api/admin/config/business-hours", {
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      setErr(`Não consegui carregar horários. (${res.status}) ${txt}`);
      setLoading(false);
      return;
    }

    const data = (await res.json().catch(() => [])) as BusinessHourDTO[];
    setRows(normalizeRows(Array.isArray(data) ? data : []));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const canSave = useMemo(() => {
    if (!rows.length) return false;
    // valida: start < end quando ativo
    for (const r of rows) {
      if (!r.active) continue;
      if (!r.start || !r.end) return false;
      if (r.start >= r.end) return false;
    }
    return true;
  }, [rows]);

  async function save() {
    setSaving(true);
    setErr(null);

    const res = await fetch("/api/admin/config/business-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? `Erro ao salvar (${res.status}).`);
      setSaving(false);
      return;
    }

    setSaving(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur">
        <div className="text-xl font-semibold">Configurações</div>
        <div className="text-sm text-white/60">
          Horário de trabalho (disponibilidade para agenda).
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-sm font-medium">Horário de trabalho</div>
            <div className="text-xs text-white/60">
              Defina os dias e horários disponíveis.
            </div>
          </div>

          <button
            onClick={save}
            disabled={loading || saving || !canSave}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar horários"}
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Carregando...
            </div>
          ) : (
            <div className="grid gap-3">
              {rows.map((r) => (
                <div
                  key={r.weekday}
                  className="grid items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-[140px_140px_1fr_1fr]"
                >
                  <div className="flex items-center justify-between md:justify-start md:gap-3">
                    <div className="text-sm font-medium">
                      {WEEK.find((w) => w.k === r.weekday)?.label ?? r.weekday}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setRows((prev) =>
                          prev.map((x) =>
                            x.weekday === r.weekday
                              ? { ...x, active: !x.active }
                              : x
                          )
                        )
                      }
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        r.active
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
                          : "border-white/10 bg-black/30 text-white/70"
                      }`}
                    >
                      {r.active ? "Ativo" : "Inativo"}
                    </button>
                  </div>

                  <div className="text-xs text-white/60 md:text-sm">
                    {r.active ? "Disponível" : "Indisponível"}
                  </div>

                  <div className="flex gap-2">
                    <div className="w-full">
                      <div className="text-xs text-white/60">Início</div>
                      <select
                        value={r.start}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.weekday === r.weekday
                                ? { ...x, start: e.target.value }
                                : x
                            )
                          )
                        }
                        disabled={!r.active}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20 disabled:opacity-60"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full">
                      <div className="text-xs text-white/60">Fim</div>
                      <select
                        value={r.end}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.weekday === r.weekday
                                ? { ...x, end: e.target.value }
                                : x
                            )
                          )
                        }
                        disabled={!r.active}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20 disabled:opacity-60"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* validação start/end */}
                  <div className="text-xs text-white/50 md:text-sm">
                    {r.active && r.start >= r.end ? (
                      <span className="text-red-300">
                        Início precisa ser menor que fim.
                      </span>
                    ) : (
                      <span>OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-xs text-white/50">
            Dica: para almoço/intervalo a gente pode evoluir depois (2 turnos
            por dia). Amanhã já dá pra apresentar assim.
          </div>
        </div>
      </div>
    </div>
  );
}
