import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "msh_token";

function moneyBRL(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dtBR(d: Date | null | undefined) {
  if (!d) return "-";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function authOrThrow() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  jwt.verify(token, process.env.JWT_SECRET!);
}

function docToBuffer(doc: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err: any) => reject(err));
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authOrThrow();

    const { id } = await params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        serviceOrder: true,
        items: true,
      },
    });

    if (!inv) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // ===== PDF =====
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: { Title: `Nota ${inv.number}`, Author: "MSH Hidráulica" },
    });

    // Cabeçalho
    doc.fontSize(16).text("MSH Hidráulica");
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor("#444");
    doc.text("Documento: Nota/Fatura");
    doc.text(`Nº: ${inv.number}`);
    doc.text(`Status: ${inv.status}`);
    doc.text(`Emitida em: ${dtBR(inv.issuedAt)}`);
    doc.text(`Venc.: ${dtBR(inv.dueAt)}`);
    doc.fillColor("#000");

    doc.moveDown(1);

    // Cliente
    doc.fontSize(12).text("Cliente");
    doc.moveDown(0.4);

    doc.fontSize(10);
    doc.text(inv.customer?.name ?? "—");
    if (inv.customer?.email) doc.text(inv.customer.email);
    if (inv.customer?.phone) doc.text(inv.customer.phone);
    if (inv.customer?.address) doc.text(inv.customer.address);

    doc.moveDown(1);

    // Referência
    doc.fontSize(12).text("Referência");
    doc.moveDown(0.4);

    doc.fontSize(10);
    doc.text(inv.serviceOrder ? `OS #${inv.serviceOrder.number}` : "—");
    doc.text(`Pago em: ${dtBR(inv.paidAt)}`);

    // Itens
    doc.moveDown(1);
    doc.fontSize(12).text("Itens");
    doc.moveDown(0.5);

    const startX = 40;
    const colDesc = startX;
    const colQty = 360;
    const colUnit = 420;
    const colTotal = 500;

    doc.fontSize(10).fillColor("#111");
    doc.text("Descrição", colDesc, doc.y);
    doc.text("Qtd", colQty, doc.y, { width: 40, align: "right" });
    doc.text("Unit", colUnit, doc.y, { width: 70, align: "right" });
    doc.text("Total", colTotal, doc.y, { width: 70, align: "right" });

    doc.moveDown(0.3);
    doc.moveTo(startX, doc.y).lineTo(555, doc.y).strokeColor("#DDD").stroke();
    doc.moveDown(0.6);

    doc.fillColor("#000");
    for (const it of inv.items) {
      const y = doc.y;

      doc.fontSize(10);
      doc.text(it.description, colDesc, y, { width: 310 });
      doc.text(String(it.qty ?? 1), colQty, y, { width: 40, align: "right" });
      doc.text(moneyBRL(it.unitCents), colUnit, y, {
        width: 70,
        align: "right",
      });
      doc.text(moneyBRL(it.totalCents), colTotal, y, {
        width: 70,
        align: "right",
      });

      doc.moveDown(0.9);
    }

    // Totais
    doc.moveDown(0.5);
    doc.moveTo(startX, doc.y).lineTo(555, doc.y).strokeColor("#DDD").stroke();
    doc.moveDown(0.6);

    doc.fontSize(11).fillColor("#111");
    doc.text("Subtotal", colUnit, doc.y, { width: 70, align: "right" });
    doc.text(moneyBRL(inv.subtotalCents), colTotal, doc.y, {
      width: 70,
      align: "right",
    });

    doc.moveDown(0.4);
    doc.text("Desconto", colUnit, doc.y, { width: 70, align: "right" });
    doc.text(moneyBRL(inv.discountCents), colTotal, doc.y, {
      width: 70,
      align: "right",
    });

    doc.moveDown(0.6);
    doc
      .fontSize(12)
      .text("Total", colUnit, doc.y, { width: 70, align: "right" });
    doc.text(moneyBRL(inv.totalCents), colTotal, doc.y, {
      width: 70,
      align: "right",
    });

    doc.moveDown(1.2);
    doc.fontSize(9).fillColor("#777");
    doc.text("Observação: este documento é uma fatura/recibo interno.");

    doc.end();

    const pdfBuffer = await docToBuffer(doc);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="nota-${inv.number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    if (String(e?.message) === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
