import { NextRequest, NextResponse } from "next/server";
import {
  createProjectDistribution,
  getProjectDistributions,
} from "@/lib/editorial/distribution/services";
import { logEditorialActivity } from "@/lib/editorial/db/mutations";
import type {
  DistributionChannel,
  DistributionRegion,
  ProjectDistributionMetadata,
} from "@/lib/editorial/distribution/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const distributions = await getProjectDistributions(projectId);

    return NextResponse.json({ distributions });
  } catch (error) {
    console.error("Failed to get distributions:", error);
    return NextResponse.json(
      { error: "Failed to get distributions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const {
      channel,
      exportId,
      price,
      currency,
      regions,
      metadata,
    } = body as {
      channel: DistributionChannel;
      exportId?: string;
      price?: number;
      currency?: string;
      regions?: DistributionRegion[];
      metadata?: ProjectDistributionMetadata;
    };

    if (!channel) {
      return NextResponse.json(
        { error: "Distribution channel is required" },
        { status: 400 }
      );
    }

    const distribution = await createProjectDistribution({
      projectId,
      channel,
      exportId,
      price,
      currency,
      regions,
      metadata,
    });

    await logEditorialActivity(projectId, "distribution_created", {
      stageKey: "distribution",
      payload: {
        distribution_id: distribution.id,
        channel,
        regions: distribution.regions,
      },
    });

    return NextResponse.json({ distribution }, { status: 201 });
  } catch (error) {
    console.error("Failed to create distribution:", error);
    return NextResponse.json(
      { error: "Failed to create distribution" },
      { status: 500 }
    );
  }
}
