import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import type {
  DistributionChannel,
  DistributionStatus,
  DistributionRegion,
  ProjectDistribution,
  ProjectDistributionMetadata,
  DistributionChannelConfig,
} from "./types";

export async function createProjectDistribution(options: {
  projectId: string;
  channel: DistributionChannel;
  exportId?: string;
  price?: number;
  currency?: string;
  regions?: DistributionRegion[];
  metadata?: ProjectDistributionMetadata;
}): Promise<ProjectDistribution> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_project_distributions")
    .insert({
      project_id: options.projectId,
      channel: options.channel,
      status: "draft",
      export_id: options.exportId ?? null,
      price: options.price ?? null,
      currency: options.currency ?? "USD",
      regions: options.regions ?? ["worldwide"],
      metadata: options.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create distribution: ${error?.message}`);
  }

  return data as ProjectDistribution;
}

export async function getProjectDistributions(projectId: string): Promise<ProjectDistribution[]> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("editorial_project_distributions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[v0] Failed to get distributions:", error.message);
      return [];
    }

    return (data ?? []) as ProjectDistribution[];
  } catch (error) {
    console.warn("[v0] Error fetching distributions:", error);
    return [];
  }
}

export async function updateDistributionStatus(
  distributionId: string,
  status: DistributionStatus,
  options?: {
    externalId?: string;
    externalUrl?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "submitted") {
    updates.submitted_at = new Date().toISOString();
  }

  if (status === "live") {
    updates.published_at = new Date().toISOString();
  }

  if (options?.externalId) {
    updates.external_id = options.externalId;
  }

  if (options?.externalUrl) {
    updates.external_url = options.externalUrl;
  }

  if (options?.errorMessage) {
    updates.error_message = options.errorMessage;
  }

  updates.last_synced_at = new Date().toISOString();

  const { error } = await supabase
    .from("editorial_project_distributions")
    .update(updates)
    .eq("id", distributionId);

  if (error) {
    throw new Error(`Failed to update distribution status: ${error.message}`);
  }
}

export async function updateDistributionMetadata(
  distributionId: string,
  metadata: Partial<ProjectDistributionMetadata>
): Promise<void> {
  const supabase = getAdminClient();

  // Get current metadata
  const { data: current } = await supabase
    .from("editorial_project_distributions")
    .select("metadata")
    .eq("id", distributionId)
    .single();

  const updatedMetadata = {
    ...(current?.metadata ?? {}),
    ...metadata,
  };

  const { error } = await supabase
    .from("editorial_project_distributions")
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", distributionId);

  if (error) {
    throw new Error(`Failed to update distribution metadata: ${error.message}`);
  }
}

export async function deleteDistribution(distributionId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("editorial_project_distributions")
    .delete()
    .eq("id", distributionId);

  if (error) {
    throw new Error(`Failed to delete distribution: ${error.message}`);
  }
}

export async function getOrgDistributionChannels(): Promise<DistributionChannelConfig[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_distribution_channels")
    .select("*")
    .eq("org_id", ORG_ID)
    .eq("is_enabled", true)
    .order("name", { ascending: true });

  if (error) {
    // Table may not exist yet, return empty array
    return [];
  }

  return (data ?? []) as DistributionChannelConfig[];
}

export async function submitToChannel(
  distributionId: string,
  _channel: DistributionChannel
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  // This is a placeholder for actual API integration
  // In production, this would connect to each platform's API
  
  try {
    // Simulate submission process
    await updateDistributionStatus(distributionId, "submitted");
    
    // In production, you would:
    // 1. Get the export file
    // 2. Upload to the channel's API
    // 3. Submit metadata
    // 4. Get external ID
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateDistributionStatus(distributionId, "rejected", {
      errorMessage: message,
    });
    return { success: false, error: message };
  }
}
