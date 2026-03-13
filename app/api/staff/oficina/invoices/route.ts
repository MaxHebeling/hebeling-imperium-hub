import { NextRequest, NextResponse } from "next/server";
import { generateInvoiceHTML, generateReceiptHTML } from "@/lib/editorial/oficina/invoice-templates";
import type { InvoiceData, ReceiptData } from "@/lib/editorial/oficina/types";

/**
 * POST /api/staff/oficina/invoices
 * Generate an invoice or receipt HTML document.
 * Pass { type: "invoice" | "receipt" } to select which to generate.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const docType: string = body.type || "invoice";

    if (docType === "receipt") {
      return handleReceipt(body);
    }

    return handleInvoice(body);
  } catch (err) {
    console.error("[oficina/invoices] Error:", err);
    return NextResponse.json(
      { error: "Error al generar documento" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Invoice handler                                                   */
/* ------------------------------------------------------------------ */
function handleInvoice(body: Record<string, unknown>) {
  const data = body as unknown as InvoiceData;

  if (!data.client?.fullName || !data.client?.email) {
    return NextResponse.json(
      { error: "Datos del cliente incompletos" },
      { status: 400 },
    );
  }
  if (!data.items || data.items.length === 0) {
    return NextResponse.json(
      { error: "Debe incluir al menos un concepto" },
      { status: 400 },
    );
  }

  // Recalculate individual item amounts
  const items = data.items.map((it) => ({
    ...it,
    amount: it.amount || it.quantity * it.unitPrice,
  }));

  // Auto-calculate totals
  const subtotal =
    data.subtotal || items.reduce((s, it) => s + it.amount, 0);
  const discount = (data.discount ?? 0);
  // taxRate comes as percentage (e.g. 16 for 16%), convert to decimal for calculations
  const taxRateInput = data.taxRate ?? 0;
  const taxRateDecimal = taxRateInput > 1 ? taxRateInput / 100 : taxRateInput;
  const taxAmount = data.taxAmount ?? (subtotal - discount) * taxRateDecimal;
  const total = data.total ?? subtotal - discount + taxAmount;

  const invoiceData: InvoiceData = {
    ...data,
    items,
    invoiceNumber:
      data.invoiceNumber || `RE-INV-${String(Date.now()).slice(-6)}`,
    subtotal,
    discount,
    taxRate: taxRateDecimal,
    taxAmount,
    total,
    amountPaid: data.amountPaid ?? 0,
    issueDate: data.issueDate || new Date().toISOString(),
    dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    status: data.status || "draft",
    locale: data.locale || "es",
    createdAt: new Date().toISOString(),
  };

  const html = generateInvoiceHTML(invoiceData);
  return NextResponse.json({ html, invoice: invoiceData });
}

/* ------------------------------------------------------------------ */
/*  Receipt handler                                                   */
/* ------------------------------------------------------------------ */
function handleReceipt(body: Record<string, unknown>) {
  const data = body as unknown as ReceiptData;

  if (!data.client?.fullName) {
    return NextResponse.json(
      { error: "Datos del cliente incompletos" },
      { status: 400 },
    );
  }

  const receiptData: ReceiptData = {
    ...data,
    receiptNumber:
      data.receiptNumber || `RE-REC-${String(Date.now()).slice(-6)}`,
    locale: data.locale || "es",
    paymentDate: data.paymentDate || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const html = generateReceiptHTML(receiptData);
  return NextResponse.json({ html, receipt: receiptData });
}
