/* ------------------------------------------------------------------ */
/*  Oficina de Reino Editorial — Invoice & Receipt Templates          */
/* ------------------------------------------------------------------ */

import type { InvoiceData, ReceiptData, ContractLocale } from "./types";
import { COMPANY_INFO } from "./company-config";

/** Date formatting helper */
function fmtDate(iso: string, locale: ContractLocale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Currency formatting */
function fmtCurrency(amount: number, currency: "USD" | "MXN" | "ARS"): string {
  const loc = currency === "USD" ? "en-US" : currency === "ARS" ? "es-AR" : "es-MX";
  return new Intl.NumberFormat(loc, { style: "currency", currency }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Generate Invoice HTML                                             */
/* ------------------------------------------------------------------ */

export function generateInvoiceHTML(data: InvoiceData): string {
  const t = data.locale === "es" ? INVOICE_ES : INVOICE_EN;
  const co = COMPANY_INFO;

  const itemRows = data.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${item.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:right;">${fmtCurrency(item.unitPrice, data.currency)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:right;font-weight:600;">${fmtCurrency(item.amount, data.currency)}</td>
      </tr>`
    )
    .join("");

  const statusColor =
    data.status === "paid"
      ? "#059669"
      : data.status === "overdue"
        ? "#dc2626"
        : data.status === "sent"
          ? "#2563eb"
          : "#6b7280";

  const statusLabel =
    data.locale === "es"
      ? { draft: "Borrador", sent: "Enviada", paid: "Pagada", overdue: "Vencida", cancelled: "Cancelada" }[data.status]
      : { draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue", cancelled: "Cancelled" }[data.status];

  return `<!DOCTYPE html>
<html lang="${data.locale}">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 0; }
    .page { max-width: 700px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .logo-area h1 { font-size: 24px; color: #1a3a6b; margin: 0; }
    .logo-area p { font-size: 12px; color: #6b7280; margin: 3px 0 0; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 28px; color: #1a3a6b; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
    .invoice-info .number { font-size: 14px; color: #6b7280; margin: 4px 0; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .divider { height: 3px; background: linear-gradient(90deg, #1a3a6b, #2a5a9b); border-radius: 2px; margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-block label { display: block; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600; }
    .info-block p { font-size: 13px; color: #374151; margin: 0; line-height: 1.5; }
    .info-block .name { font-weight: 700; font-size: 14px; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f8fafc; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; text-align: left; font-weight: 700; border-bottom: 2px solid #e5e7eb; }
    th:nth-child(3) { text-align: center; }
    th:nth-child(4), th:last-child { text-align: right; }
    .totals { margin-left: auto; width: 250px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #4b5563; }
    .totals .row.total { border-top: 2px solid #1a3a6b; padding-top: 10px; margin-top: 6px; }
    .totals .row.total span { font-size: 16px; font-weight: 800; color: #1a3a6b; }
    .dates { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 20px; }
    .dates label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .dates p { font-size: 13px; color: #374151; margin: 2px 0 0; font-weight: 600; }
    .payment-info { padding: 16px; background: #f0f4ff; border: 1px solid #dbeafe; border-radius: 12px; margin-bottom: 20px; }
    .payment-info h3 { font-size: 12px; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; font-weight: 700; }
    .payment-info p { font-size: 12px; color: #4b5563; margin: 2px 0; }
    .notes { padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.6; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <h1>${co.name}</h1>
      <p>${co.legalName}</p>
      <p>${co.address}</p>
      <p>${co.email}</p>
      ${co.phone ? `<p>${co.phone}</p>` : ""}
    </div>
    <div class="invoice-info">
      <h2>${t.invoice}</h2>
      <p class="number">${data.invoiceNumber}</p>
      <span class="status-badge" style="background:${statusColor}15;color:${statusColor};">${statusLabel}</span>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Client & Project info -->
  <div class="info-grid">
    <div class="info-block">
      <label>${t.billTo}</label>
      <p class="name">${data.client.fullName}</p>
      ${data.client.address ? `<p>${data.client.address}</p>` : ""}
      <p>${data.client.email}</p>
      ${data.client.phone ? `<p>${data.client.phone}</p>` : ""}
      ${data.client.taxId ? `<p>${t.taxId}: ${data.client.taxId}</p>` : ""}
    </div>
    <div class="info-block">
      <label>${t.project}</label>
      <p class="name">${data.projectTitle}</p>
    </div>
  </div>

  <!-- Dates -->
  <div class="dates">
    <div>
      <label>${t.issueDate}</label>
      <p>${fmtDate(data.issueDate, data.locale)}</p>
    </div>
    <div>
      <label>${t.dueDate}</label>
      <p>${fmtDate(data.dueDate, data.locale)}</p>
    </div>
  </div>

  <!-- Items -->
  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>${t.description}</th>
        <th style="width:60px;">${t.qty}</th>
        <th style="width:100px;">${t.unitPrice}</th>
        <th style="width:100px;">${t.amount}</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="row">
      <span>Subtotal</span>
      <span>${fmtCurrency(data.subtotal, data.currency)}</span>
    </div>
    ${(data.discount ?? 0) > 0 ? `
    <div class="row" style="color:#dc2626;">
      <span>- ${t.discount}</span>
      <span>${fmtCurrency(data.discount ?? 0, data.currency)}</span>
    </div>
    ` : ""}
    ${data.taxRate > 0 ? `
    <div class="row">
      <span>${t.tax} (${(data.taxRate * 100).toFixed(0)}%)</span>
      <span>${fmtCurrency(data.taxAmount, data.currency)}</span>
    </div>
    ` : ""}
    <div class="row total">
      <span>Total</span>
      <span>${fmtCurrency(data.total, data.currency)}</span>
    </div>
    ${(data.amountPaid ?? 0) > 0 ? `
    <div class="row">
      <span>${t.amountPaid}</span>
      <span>${fmtCurrency(data.amountPaid ?? 0, data.currency)}</span>
    </div>
    <div class="row total" style="margin-top:2px;">
      <span>${t.balanceDue}</span>
      <span>${fmtCurrency(data.total - (data.amountPaid ?? 0), data.currency)}</span>
    </div>
    ` : ""}
  </div>

  <!-- Payment info -->
  ${co.bankName ? `
  <div class="payment-info">
    <h3>${t.paymentInfo}</h3>
    <p><strong>${t.bank}:</strong> ${co.bankName}</p>
    ${co.bankAccount ? `<p><strong>${t.account}:</strong> ${co.bankAccount}</p>` : ""}
    ${co.bankClabe ? `<p><strong>CLABE:</strong> ${co.bankClabe}</p>` : ""}
    <p><strong>${t.beneficiary}:</strong> ${co.legalName}</p>
  </div>
  ` : ""}

  <!-- Notes -->
  ${data.notes ? `
  <div class="notes">
    <strong>${t.notes}:</strong> ${data.notes}
  </div>
  ` : ""}

  <!-- Footer -->
  <div class="footer">
    <p>${t.thankYou}</p>
    <p>${co.name} &middot; ${co.website} &middot; ${co.email}</p>
  </div>

</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Generate Receipt HTML                                             */
/* ------------------------------------------------------------------ */

export function generateReceiptHTML(data: ReceiptData): string {
  const t = data.locale === "es" ? RECEIPT_ES : RECEIPT_EN;
  const co = COMPANY_INFO;

  return `<!DOCTYPE html>
<html lang="${data.locale}">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 0; }
    .page { max-width: 500px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #059669; }
    .header h1 { font-size: 22px; color: #1a3a6b; margin: 0; }
    .header h2 { font-size: 16px; color: #059669; margin: 8px 0 0; text-transform: uppercase; letter-spacing: 2px; }
    .header p { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
    .details { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .detail-row .label { color: #6b7280; }
    .detail-row .value { color: #1f2937; font-weight: 600; }
    .amount-box { text-align: center; padding: 20px; background: #ecfdf5; border: 2px solid #059669; border-radius: 12px; margin-bottom: 20px; }
    .amount-box .label { font-size: 11px; color: #059669; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
    .amount-box .amount { font-size: 28px; color: #059669; font-weight: 800; margin-top: 4px; }
    .paid-stamp { text-align: center; margin: 16px 0; }
    .paid-stamp span { display: inline-block; padding: 6px 20px; border: 3px solid #059669; border-radius: 8px; color: #059669; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; transform: rotate(-3deg); }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>${co.name}</h1>
    <h2>${t.receipt}</h2>
    <p>${data.receiptNumber}</p>
  </div>

  <div class="details">
    <div class="detail-row">
      <span class="label">${t.client}</span>
      <span class="value">${data.client.fullName}</span>
    </div>
    <div class="detail-row">
      <span class="label">${t.invoice}</span>
      <span class="value">${data.invoiceNumber}</span>
    </div>
    <div class="detail-row">
      <span class="label">${t.paymentDate}</span>
      <span class="value">${fmtDate(data.paymentDate, data.locale)}</span>
    </div>
    <div class="detail-row">
      <span class="label">${t.paymentMethod}</span>
      <span class="value">${data.paymentMethod}</span>
    </div>
    ${data.serviceDescription ? `
    <div class="detail-row">
      <span class="label">${data.locale === "es" ? "Servicio" : "Service"}</span>
      <span class="value">${data.serviceDescription}</span>
    </div>
    ` : ""}
  </div>

  <div class="amount-box">
    <div class="label">${t.amountReceived}</div>
    <div class="amount">${fmtCurrency(data.amount, data.currency)}</div>
  </div>

  <div class="paid-stamp">
    <span>${t.paid}</span>
  </div>

  ${data.notes ? `<p style="font-size:12px;color:#6b7280;text-align:center;">${data.notes}</p>` : ""}

  <div class="footer">
    <p>${t.thankYou}</p>
    <p>${co.name} &middot; ${co.website} &middot; ${co.email}</p>
  </div>

</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Translation strings — Invoices                                    */
/* ------------------------------------------------------------------ */

const INVOICE_ES = {
  invoice: "Factura",
  billTo: "Facturar a",
  project: "Proyecto",
  taxId: "RFC",
  issueDate: "Fecha de emision",
  dueDate: "Fecha de vencimiento",
  description: "Descripcion",
  qty: "Cant.",
  unitPrice: "P. Unitario",
  amount: "Importe",
  tax: "IVA",
  discount: "Descuento",
  amountPaid: "Monto pagado",
  balanceDue: "Saldo pendiente",
  paymentInfo: "Datos de pago",
  bank: "Banco",
  account: "Cuenta",
  beneficiary: "Beneficiario",
  notes: "Notas",
  thankYou: "Gracias por confiar en Reino Editorial.",
};

const INVOICE_EN = {
  invoice: "Invoice",
  billTo: "Bill to",
  project: "Project",
  taxId: "Tax ID",
  issueDate: "Issue date",
  dueDate: "Due date",
  description: "Description",
  qty: "Qty",
  unitPrice: "Unit price",
  amount: "Amount",
  tax: "Tax",
  discount: "Discount",
  amountPaid: "Amount Paid",
  balanceDue: "Balance Due",
  paymentInfo: "Payment details",
  bank: "Bank",
  account: "Account",
  beneficiary: "Beneficiary",
  notes: "Notes",
  thankYou: "Thank you for trusting Reino Editorial.",
};

/* ------------------------------------------------------------------ */
/*  Translation strings — Receipts                                    */
/* ------------------------------------------------------------------ */

const RECEIPT_ES = {
  receipt: "Recibo de Pago",
  client: "Cliente",
  invoice: "Factura",
  paymentDate: "Fecha de pago",
  paymentMethod: "Metodo de pago",
  amountReceived: "Monto recibido",
  paid: "Pagado",
  thankYou: "Gracias por tu pago. Este recibo es tu comprobante.",
};

const RECEIPT_EN = {
  receipt: "Payment Receipt",
  client: "Client",
  invoice: "Invoice",
  paymentDate: "Payment date",
  paymentMethod: "Payment method",
  amountReceived: "Amount received",
  paid: "Paid",
  thankYou: "Thank you for your payment. This receipt is your proof of payment.",
};
