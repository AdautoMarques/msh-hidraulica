"use client";

import { useState } from "react";

export default function DownloadInvoicePdfButton({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function download() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`, {
        cache: "no-store",
      });

      if (!res.ok) {
        alert("Não foi possível gerar o PDF.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `nota-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? "Gerando..." : "⬇️ Baixar PDF"}
    </button>
  );
}
