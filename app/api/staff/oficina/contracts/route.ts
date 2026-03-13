import { NextRequest, NextResponse } from "next/server";
import { generateContractHTML } from "@/lib/editorial/oficina/contract-templates";
import type { ContractData } from "@/lib/editorial/oficina/types";

/**
 * POST /api/staff/oficina/contracts
 * Generate a contract HTML document from the provided data.
 * Returns HTML that can be rendered or printed to PDF by the browser.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContractData;

    // Validate required fields
    if (!body.client?.fullName || !body.client?.email) {
      return NextResponse.json(
        { error: "Datos del cliente incompletos (nombre y email requeridos)" },
        { status: 400 },
      );
    }
    if (!body.projectTitle) {
      return NextResponse.json(
        { error: "Titulo del proyecto requerido" },
        { status: 400 },
      );
    }
    if (!body.services || body.services.length === 0) {
      return NextResponse.json(
        { error: "Debe incluir al menos un servicio" },
        { status: 400 },
      );
    }
    if (!body.jurisdiction) {
      return NextResponse.json(
        { error: "Jurisdiccion requerida (usa, mexico, argentina)" },
        { status: 400 },
      );
    }

    // Calculate total if not provided
    const totalAmount =
      body.totalAmount ||
      body.services.reduce((sum, s) => sum + (s.amount || 0), 0);

    const contractData: ContractData = {
      ...body,
      totalAmount,
      id: body.id || `RE-${Date.now().toString(36).toUpperCase()}`,
      startDate: body.startDate || new Date().toISOString(),
      status: body.status || "draft",
      createdAt: new Date().toISOString(),
    };

    const html = generateContractHTML(contractData);

    return NextResponse.json({ html, contract: contractData });
  } catch (err) {
    console.error("[oficina/contracts] Error:", err);
    return NextResponse.json(
      { error: "Error al generar contrato" },
      { status: 500 },
    );
  }
}
