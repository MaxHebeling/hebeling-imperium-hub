/* ------------------------------------------------------------------ */
/*  Oficina de Reino Editorial — Types                                */
/* ------------------------------------------------------------------ */

export interface CompanyInfo {
  name: string;
  legalName: string;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankAccount: string;
  bankClabe: string;
}

export interface ClientInfo {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

/* ------------------------------------------------------------------ */
/*  Contracts                                                         */
/* ------------------------------------------------------------------ */

export type ContractType =
  | "editorial_completo"
  | "correccion_estilo"
  | "diseno_portada"
  | "maquetacion"
  | "distribucion"
  | "personalizado";

export type ContractLocale = "es" | "en";

export type ContractJurisdiction = "usa" | "mexico" | "argentina";

export interface ContractData {
  id?: string;
  type: ContractType;
  locale: ContractLocale;
  jurisdiction: ContractJurisdiction;
  client: ClientInfo;
  projectTitle: string;
  services: ContractService[];
  totalAmount: number;
  currency: "USD" | "MXN" | "ARS";
  startDate: string; // ISO date
  endDate?: string;
  notes?: string;
  createdAt?: string;
  status?: "draft" | "sent" | "signed" | "cancelled";
}

export interface ContractService {
  name: string;
  description: string;
  amount: number;
}

/* ------------------------------------------------------------------ */
/*  Invoices                                                          */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  locale: ContractLocale;
  client: ClientInfo;
  projectTitle: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // e.g. 0.16 for 16% IVA
  taxAmount: number;
  total: number;
  currency: "USD" | "MXN" | "ARS";
  discount?: number;
  amountPaid?: number;
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  notes?: string;
  status: InvoiceStatus;
  createdAt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/* ------------------------------------------------------------------ */
/*  Receipt                                                           */
/* ------------------------------------------------------------------ */

export interface ReceiptData {
  id?: string;
  receiptNumber: string;
  locale: ContractLocale;
  client: ClientInfo;
  invoiceNumber: string;
  amount: number;
  currency: "USD" | "MXN" | "ARS";
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  createdAt?: string;
}
