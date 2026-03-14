/* ------------------------------------------------------------------ */
/*  Oficina de Reino Editorial — Contract Templates                   */
/*  Jurisdictions: USA (ES/EN), Mexico (ES), Argentina (ES)           */
/* ------------------------------------------------------------------ */

import type { ContractData, ContractLocale, ContractJurisdiction } from "./types";
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

/** Pick the right translation set for jurisdiction + locale */
function pickStrings(jurisdiction: ContractJurisdiction, locale: ContractLocale) {
  if (jurisdiction === "usa") return locale === "es" ? USA_ES : USA_EN;
  if (jurisdiction === "argentina") return ARGENTINA_ES;
  return MEXICO_ES; // default: mexico
}

/* ------------------------------------------------------------------ */
/*  Generate contract HTML for PDF rendering                          */
/* ------------------------------------------------------------------ */

export function generateContractHTML(data: ContractData): string {
  const t = pickStrings(data.jurisdiction, data.locale);
  const co = COMPANY_INFO;
  const addressHTML = co.address.replace(/\n/g, "<br/>");

  const servicesRows = data.services
    .map(
      (s, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">
          <strong>${s.name}</strong>${s.description ? `<br/><span style="color:#6b7280;font-size:12px;">${s.description}</span>` : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:right;">${fmtCurrency(s.amount, data.currency)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${data.locale}">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; margin: 0; padding: 0; }
    .page { max-width: 700px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #1a3a6b; padding-bottom: 20px; }
    .logo-area h1 { font-size: 22px; color: #1a3a6b; margin: 0; }
    .logo-area p { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
    .contract-label { text-align: right; }
    .contract-label h2 { font-size: 16px; color: #1a3a6b; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
    .contract-label p { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
    .jurisdiction-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #f0f4ff; color: #1a3a6b; border: 1px solid #dbeafe; margin-top: 6px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-block label { display: block; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .info-block p { font-size: 13px; color: #374151; margin: 0; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: left; }
    th:last-child { text-align: right; }
    .total-row { background: #1a3a6b; color: white; }
    .total-row td { padding: 10px 12px; font-weight: 700; font-size: 14px; }
    .clause { font-size: 12px; color: #4b5563; line-height: 1.7; margin-bottom: 12px; }
    .clause strong { color: #1f2937; }
    .legal-ref { font-size: 11px; color: #9ca3af; font-style: italic; margin-top: 16px; padding-top: 8px; border-top: 1px dashed #e5e7eb; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .sig-block { border-top: 1px solid #d1d5db; padding-top: 8px; }
    .sig-block p { font-size: 12px; color: #6b7280; margin: 2px 0; }
    .sig-block .name { font-size: 13px; color: #1f2937; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <h1>${co.name}</h1>
      <p>${addressHTML}</p>
      <p>${co.website} &middot; ${co.email}</p>
    </div>
    <div class="contract-label">
      <h2>${t.contractTitle}</h2>
      <p>${t.date}: ${fmtDate(data.startDate, data.locale)}</p>
      ${data.id ? `<p>${t.ref}: ${data.id}</p>` : ""}
      <span class="jurisdiction-badge">${t.jurisdictionLabel}</span>
    </div>
  </div>

  <!-- Parties -->
  <div class="section">
    <div class="section-title">${t.parties}</div>
    <div class="info-grid">
      <div class="info-block">
        <label>${t.provider}</label>
        <p><strong>${co.legalName}</strong></p>
        <p>${addressHTML}</p>
        ${co.taxId ? `<p>${t.taxId}: ${co.taxId}</p>` : ""}
        <p>${co.email}</p>
      </div>
      <div class="info-block">
        <label>${t.client}</label>
        <p><strong>${data.client.fullName}</strong></p>
        ${data.client.address ? `<p>${data.client.address}</p>` : ""}
        ${data.client.taxId ? `<p>${t.taxId}: ${data.client.taxId}</p>` : ""}
        <p>${data.client.email}</p>
      </div>
    </div>
  </div>

  <!-- Project -->
  <div class="section">
    <div class="section-title">${t.project}</div>
    <div class="info-grid">
      <div class="info-block">
        <label>${t.projectTitle}</label>
        <p><strong>${data.projectTitle}</strong></p>
      </div>
      ${data.authorName ? `
      <div class="info-block">
        <label>${data.locale === "es" ? "Autor" : "Author"}</label>
        <p><strong>${data.authorName}</strong></p>
      </div>
      ` : ""}
    </div>
    ${data.bookFormat ? `
    <div class="info-block" style="margin-top:10px;">
      <label>${data.locale === "es" ? "Formato" : "Format"}</label>
      <p>${data.bookFormat === "print" ? (data.locale === "es" ? "Impresion" : "Print") : data.bookFormat === "ebook" ? "eBook" : (data.locale === "es" ? "Impresion + eBook" : "Print + eBook")}</p>
    </div>
    ` : ""}
  </div>

  <!-- Services -->
  <div class="section">
    <div class="section-title">${t.services}</div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th>${t.serviceDesc}</th>
          <th style="width:120px;">${t.amount}</th>
        </tr>
      </thead>
      <tbody>
        ${servicesRows}
        <tr class="total-row">
          <td colspan="2" style="text-align:right;">TOTAL</td>
          <td style="text-align:right;">${fmtCurrency(data.totalAmount, data.currency)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Terms -->
  <div class="section">
    <div class="section-title">${t.terms}</div>
    ${t.clauses
      .map((c: string, i: number) => `<p class="clause"><strong>${i + 1}.</strong> ${c}</p>`)
      .join("")}
    <p class="legal-ref">${t.legalReference}</p>
  </div>

  ${data.notes ? `
  <div class="section">
    <div class="section-title">${t.notes}</div>
    <p class="clause">${data.notes}</p>
  </div>
  ` : ""}

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-block">
      <p class="name">${co.legalName}</p>
      <p>${t.provider}</p>
      <br/><br/><br/>
      <p>________________________</p>
      <p>${t.signature}</p>
    </div>
    <div class="sig-block">
      <p class="name">${data.client.fullName}</p>
      <p>${t.client}</p>
      <br/><br/><br/>
      <p>________________________</p>
      <p>${t.signature}</p>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>${co.name} &middot; ${co.website} &middot; ${co.email}</p>
  </div>

</div>
</body>
</html>`;
}

/* ================================================================== */
/*  CONTRACT CLAUSES BY JURISDICTION                                  */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  USA — English                                                     */
/* ------------------------------------------------------------------ */
const USA_EN = {
  contractTitle: "Editorial Services Agreement",
  date: "Date",
  ref: "Ref",
  parties: "Parties",
  provider: "Service Provider",
  client: "Client",
  taxId: "Tax ID / EIN",
  project: "Project",
  projectTitle: "Work title",
  services: "Contracted Services",
  serviceDesc: "Service description",
  amount: "Amount",
  terms: "Terms and Conditions",
  notes: "Additional Notes",
  signature: "Signature",
  jurisdictionLabel: "USA Law",
  legalReference: "This Agreement is governed by the laws of the State of California, United States, without regard to its conflict of laws principles. Any dispute shall be resolved in the courts of San Diego County, California.",
  clauses: [
    "SCOPE OF WORK. The Provider agrees to perform the editorial services described in this Agreement with professional quality standards consistent with industry practice.",
    "MANUSCRIPT DELIVERY. The Client agrees to deliver the manuscript in digital format (Microsoft Word or PDF) by the agreed-upon date to initiate the editorial process.",
    "PAYMENT TERMS. Payment shall be made in accordance with the amounts and schedule set forth herein. A non-refundable deposit of fifty percent (50%) of the total amount is required before work begins. The remaining balance is due upon delivery of completed services.",
    "DELIVERY TIMELINE. The estimated completion time is twelve (12) business days from receipt of the manuscript and the corresponding deposit, unless otherwise agreed in writing.",
    "INTELLECTUAL PROPERTY. All copyrights and intellectual property rights in the original manuscript shall remain exclusively with the Client. The Provider does not acquire any ownership rights or licenses to the work beyond what is necessary to perform the services.",
    "CONFIDENTIALITY. The Provider agrees to maintain the confidentiality of the Client's manuscript and all related materials. No portion of the work shall be disclosed, reproduced, or distributed to third parties without prior written consent.",
    "REVISIONS. The services include up to two (2) rounds of revisions based on the Client's feedback. Additional revisions beyond this scope may be subject to additional fees as agreed by both parties.",
    "LIMITATION OF LIABILITY. The Provider's total liability under this Agreement shall not exceed the total amount paid by the Client for services rendered.",
    "CANCELLATION. In the event of cancellation by the Client after work has commenced, the deposit shall be retained as payment for services already rendered. If more than 50% of the work has been completed, the Client shall pay for the proportional amount of work completed.",
    "AMENDMENTS. Any modifications to this Agreement must be made in writing and signed by both parties to be effective.",
    "FORCE MAJEURE. Neither party shall be liable for delays or failures in performance resulting from causes beyond their reasonable control.",
    "ENTIRE AGREEMENT. This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, or agreements.",
  ],
};

/* ------------------------------------------------------------------ */
/*  USA — Espanol                                                     */
/* ------------------------------------------------------------------ */
const USA_ES = {
  contractTitle: "Contrato de Servicios Editoriales",
  date: "Fecha",
  ref: "Ref",
  parties: "Partes",
  provider: "Prestador de servicios",
  client: "Cliente",
  taxId: "Tax ID / EIN",
  project: "Proyecto",
  projectTitle: "Titulo de la obra",
  services: "Servicios contratados",
  serviceDesc: "Descripcion del servicio",
  amount: "Monto",
  terms: "Terminos y condiciones",
  notes: "Notas adicionales",
  signature: "Firma",
  jurisdictionLabel: "Leyes de EE.UU.",
  legalReference: "Este contrato se rige por las leyes del Estado de California, Estados Unidos, sin consideracion a sus principios de conflicto de leyes. Cualquier disputa sera resuelta en los tribunales del Condado de San Diego, California.",
  clauses: [
    "ALCANCE DEL TRABAJO. El Prestador se compromete a realizar los servicios editoriales descritos en este contrato con estandares profesionales de calidad consistentes con la practica de la industria.",
    "ENTREGA DEL MANUSCRITO. El Cliente se compromete a entregar el manuscrito en formato digital (Microsoft Word o PDF) en la fecha acordada para iniciar el proceso editorial.",
    "CONDICIONES DE PAGO. El pago se realizara de acuerdo con los montos y el calendario establecidos en este contrato. Se requiere un deposito no reembolsable del cincuenta por ciento (50%) del monto total antes de iniciar el trabajo. El saldo restante vence al momento de la entrega de los servicios completados.",
    "PLAZO DE ENTREGA. El tiempo estimado de finalizacion es de doce (12) dias habiles a partir de la recepcion del manuscrito y el deposito correspondiente, salvo acuerdo por escrito en contrario.",
    "PROPIEDAD INTELECTUAL. Todos los derechos de autor y derechos de propiedad intelectual del manuscrito original permanecen exclusivamente con el Cliente. El Prestador no adquiere ningun derecho de propiedad ni licencia sobre la obra mas alla de lo necesario para realizar los servicios.",
    "CONFIDENCIALIDAD. El Prestador se compromete a mantener la confidencialidad del manuscrito del Cliente y todos los materiales relacionados. Ninguna porcion del trabajo sera divulgada, reproducida o distribuida a terceros sin consentimiento previo por escrito.",
    "REVISIONES. Los servicios incluyen hasta dos (2) rondas de revisiones basadas en los comentarios del Cliente. Las revisiones adicionales fuera de este alcance pueden estar sujetas a tarifas adicionales segun lo acordado por ambas partes.",
    "LIMITACION DE RESPONSABILIDAD. La responsabilidad total del Prestador bajo este contrato no excedera el monto total pagado por el Cliente por los servicios prestados.",
    "CANCELACION. En caso de cancelacion por parte del Cliente despues de iniciado el trabajo, el deposito sera retenido como pago por los servicios ya realizados. Si mas del 50% del trabajo ha sido completado, el Cliente debera pagar el monto proporcional del trabajo realizado.",
    "MODIFICACIONES. Cualquier modificacion a este contrato debera hacerse por escrito y ser firmada por ambas partes para ser efectiva.",
    "FUERZA MAYOR. Ninguna de las partes sera responsable por retrasos o incumplimientos derivados de causas fuera de su control razonable.",
    "ACUERDO COMPLETO. Este contrato constituye el entendimiento completo entre las partes con respecto al objeto del mismo y reemplaza todas las negociaciones, representaciones o acuerdos anteriores.",
  ],
};

/* ------------------------------------------------------------------ */
/*  Mexico — Espanol                                                  */
/* ------------------------------------------------------------------ */
const MEXICO_ES = {
  contractTitle: "Contrato de Prestacion de Servicios Editoriales",
  date: "Fecha",
  ref: "Ref",
  parties: "Partes contratantes",
  provider: "Prestador de servicios",
  client: "Cliente",
  taxId: "RFC",
  project: "Proyecto",
  projectTitle: "Titulo de la obra",
  services: "Servicios contratados",
  serviceDesc: "Descripcion del servicio",
  amount: "Monto",
  terms: "Clausulas",
  notes: "Notas adicionales",
  signature: "Firma",
  jurisdictionLabel: "Leyes de Mexico",
  legalReference: "Este contrato se rige e interpreta de conformidad con las leyes de los Estados Unidos Mexicanos, en particular el Codigo Civil Federal, la Ley Federal del Derecho de Autor y la Ley Federal de Proteccion al Consumidor. Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdiccion de los tribunales competentes de la ciudad de Tijuana, Baja California.",
  clauses: [
    "PRIMERA. OBJETO. El Prestador se obliga a realizar los servicios editoriales descritos en este contrato, los cuales incluyen pero no se limitan a los conceptos detallados en la tabla de servicios, comprometiendose a ejecutarlos con la calidad, diligencia y profesionalismo que le caracterizan.",
    "SEGUNDA. ENTREGA DEL MATERIAL. El Cliente se obliga a entregar el manuscrito en formato digital (Word o PDF) en la fecha convenida. La demora en la entrega del material por parte del Cliente podra modificar los plazos de entrega del trabajo terminado.",
    "TERCERA. CONTRAPRESTACION Y FORMA DE PAGO. El pago total por los servicios sera el indicado en este contrato. Se requiere un anticipo del cincuenta por ciento (50%) para dar inicio a los trabajos, siendo el saldo restante pagadero a la entrega del trabajo terminado. Los pagos se realizaran mediante transferencia bancaria o el medio que las partes convengan.",
    "CUARTA. PLAZO DE ENTREGA. El plazo estimado para la conclusion de los servicios sera de doce (12) dias habiles contados a partir de la recepcion del manuscrito y del anticipo correspondiente, salvo causa de fuerza mayor debidamente acreditada.",
    "QUINTA. DERECHOS DE AUTOR. De conformidad con la Ley Federal del Derecho de Autor, los derechos patrimoniales y morales sobre la obra original permanecen en todo momento con el Cliente. El Prestador renuncia expresamente a cualquier reclamacion sobre los derechos de autor de la obra.",
    "SEXTA. CONFIDENCIALIDAD. El Prestador se obliga a guardar estricta confidencialidad sobre el contenido del manuscrito y cualquier informacion proporcionada por el Cliente, absteniendose de divulgar, reproducir o utilizar dicha informacion para fines distintos a los establecidos en el presente contrato.",
    "SEPTIMA. REVISIONES. El servicio incluye hasta dos (2) rondas de revisiones con base en las observaciones del Cliente. Las revisiones adicionales podran generar costos extra que seran convenidos por las partes previamente.",
    "OCTAVA. RESPONSABILIDAD. La responsabilidad del Prestador se limita al monto total pagado por el Cliente. El Prestador no sera responsable por danos indirectos, consecuentes o perdida de beneficios.",
    "NOVENA. CANCELACION. En caso de que el Cliente decida cancelar el servicio una vez iniciados los trabajos, el anticipo no sera reembolsable. Si se ha completado mas del 50% del trabajo, el Cliente debera cubrir el monto proporcional de los servicios realizados.",
    "DECIMA. IMPUESTOS. Cada parte sera responsable del cumplimiento de sus respectivas obligaciones fiscales derivadas del presente contrato, conforme a la legislacion fiscal mexicana aplicable.",
    "DECIMA PRIMERA. MODIFICACIONES. Toda modificacion al presente contrato debera constar por escrito y estar firmada por ambas partes para tener validez legal.",
    "DECIMA SEGUNDA. RESOLUCION DE CONTROVERSIAS. Las partes intentaran resolver cualquier controversia de buena fe y mediante negociacion directa. En caso de no llegar a un acuerdo, se sometera a la jurisdiccion de los tribunales competentes conforme a la clausula de jurisdiccion establecida.",
  ],
};

/* ------------------------------------------------------------------ */
/*  Argentina — Espanol                                               */
/* ------------------------------------------------------------------ */
const ARGENTINA_ES = {
  contractTitle: "Contrato de Locacion de Servicios Editoriales",
  date: "Fecha",
  ref: "Ref",
  parties: "Partes contratantes",
  provider: "Prestador de servicios",
  client: "Comitente",
  taxId: "CUIT",
  project: "Proyecto",
  projectTitle: "Titulo de la obra",
  services: "Servicios contratados",
  serviceDesc: "Descripcion del servicio",
  amount: "Monto",
  terms: "Clausulas",
  notes: "Notas adicionales",
  signature: "Firma",
  jurisdictionLabel: "Leyes de Argentina",
  legalReference: "El presente contrato se rige por las disposiciones del Codigo Civil y Comercial de la Nacion Argentina (Ley 26.994), la Ley 11.723 de Propiedad Intelectual y la Ley 24.240 de Defensa del Consumidor, en lo que resulte aplicable. Para cualquier controversia, las partes se someten a la jurisdiccion de los Tribunales Ordinarios en lo Civil y Comercial de la Ciudad Autonoma de Buenos Aires.",
  clauses: [
    "PRIMERA. OBJETO. El Prestador se obliga a realizar los servicios editoriales detallados en este contrato en los terminos del articulo 1251 y concordantes del Codigo Civil y Comercial de la Nacion, comprometiendose a ejecutarlos con la diligencia, calidad y profesionalismo correspondientes.",
    "SEGUNDA. ENTREGA DEL MATERIAL. El Comitente se obliga a entregar el manuscrito en formato digital (Word o PDF) en la fecha convenida. El incumplimiento en la entrega por parte del Comitente faculta al Prestador a modificar los plazos de entrega del trabajo.",
    "TERCERA. PRECIO Y FORMA DE PAGO. El precio total por los servicios sera el detallado en la tabla de servicios del presente contrato. Se requiere un anticipo del cincuenta por ciento (50%) para dar comienzo a las tareas, abonandose el saldo remanente contra la entrega del trabajo finalizado. Los pagos se efectuaran mediante transferencia bancaria o el medio que las partes acuerden.",
    "CUARTA. PLAZO DE ENTREGA. El plazo estimado de ejecucion es de doce (12) dias habiles contados desde la recepcion del manuscrito y del anticipo. Este plazo podra extenderse por causas de fuerza mayor o caso fortuito conforme al articulo 1730 del Codigo Civil y Comercial.",
    "QUINTA. PROPIEDAD INTELECTUAL. De conformidad con la Ley 11.723 de Propiedad Intelectual, los derechos patrimoniales y morales sobre la obra original corresponden exclusivamente al Comitente. El Prestador no adquiere derecho alguno sobre la obra y se compromete a no reproducirla ni difundirla.",
    "SEXTA. CONFIDENCIALIDAD. El Prestador se compromete a mantener en estricta reserva el contenido del manuscrito y toda informacion que el Comitente le proporcione, conforme al principio de buena fe contractual previsto en los articulos 9 y 961 del Codigo Civil y Comercial.",
    "SEPTIMA. REVISIONES. Los servicios incluyen hasta dos (2) instancias de revision segun las indicaciones del Comitente. Las revisiones adicionales podran generar honorarios complementarios a convenir entre las partes.",
    "OCTAVA. RESPONSABILIDAD. La responsabilidad del Prestador se limita al monto total abonado por el Comitente por los servicios contratados. El Prestador no respondera por danos indirectos ni por lucro cesante.",
    "NOVENA. RESOLUCION ANTICIPADA. En caso de que el Comitente resuelva el contrato una vez iniciados los trabajos, el anticipo quedara retenido en concepto de indemnizacion por los servicios prestados. Si se hubiere ejecutado mas del 50% del trabajo, el Comitente debera abonar proporcionalmente por los servicios realizados, conforme al articulo 1261 del Codigo Civil y Comercial.",
    "DECIMA. OBLIGACIONES TRIBUTARIAS. Cada parte sera responsable del cumplimiento de sus obligaciones tributarias, incluyendo lo dispuesto por la AFIP y las normas impositivas nacionales y provinciales aplicables.",
    "DECIMA PRIMERA. MODIFICACIONES. Toda modificacion al presente contrato debera constar por escrito y contar con la firma de ambas partes para su plena validez.",
    "DECIMA SEGUNDA. RESOLUCION DE CONTROVERSIAS. Ante cualquier diferencia, las partes procuraran resolverla de buena fe. De no arribar a un acuerdo, se sometera la cuestion a la mediacion obligatoria prevista por la Ley 26.589, y subsidiariamente a la jurisdiccion de los tribunales indicados en la clausula de jurisdiccion.",
  ],
};
