// ============================================================
// Editorial Permissions Service
// Checks whether a user is authorized to perform editorial actions
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";
import type { EditorialStage } from "@/types/editorial";

type AppRole = "superadmin" | "admin" | "sales" | "ops" | "client";

export interface EditorialPermissionContext {
  userId: string;
  orgRole: AppRole;
  bookId?: string;
  supabase: SupabaseClient;
}

/**
 * Whether a user may view editorial books in their org.
 * Staff roles (superadmin, admin, ops, sales) can view.
 */
export function canViewEditorial(orgRole: AppRole): boolean {
  return ["superadmin", "admin", "ops", "sales"].includes(orgRole);
}

/**
 * Whether a user may create or edit editorial books.
 */
export function canManageEditorialBooks(orgRole: AppRole): boolean {
  return ["superadmin", "admin", "ops"].includes(orgRole);
}

/**
 * Whether a user may advance the stage of a book.
 * Superadmin/admin always can; ops can if they have the book member flag.
 */
export async function canAdvanceStage(
  ctx: EditorialPermissionContext,
  bookId: string,
  _stage: EditorialStage
): Promise<boolean> {
  if (ctx.orgRole === "superadmin" || ctx.orgRole === "admin") {
    return true;
  }
  if (ctx.orgRole !== "ops") {
    return false;
  }
  return checkBookMemberFlag(ctx.supabase, bookId, ctx.userId, "can_advance_stage");
}

/**
 * Whether a user may reopen a stage (always requires a reason — enforced at API level).
 */
export async function canReopenStage(
  ctx: EditorialPermissionContext,
  bookId: string
): Promise<boolean> {
  if (ctx.orgRole === "superadmin" || ctx.orgRole === "admin") {
    return true;
  }
  if (ctx.orgRole !== "ops") {
    return false;
  }
  return checkBookMemberFlag(ctx.supabase, bookId, ctx.userId, "can_reopen_stage");
}

/**
 * Whether a user may apply a rule override.
 */
export async function canOverrideRules(
  ctx: EditorialPermissionContext,
  bookId: string
): Promise<boolean> {
  if (ctx.orgRole === "superadmin") {
    return true;
  }
  if (ctx.orgRole === "admin") {
    return checkBookMemberFlag(ctx.supabase, bookId, ctx.userId, "can_override_rules");
  }
  return false;
}

/**
 * Whether a user may manage checklist items for a stage.
 */
export async function canManageChecklist(
  ctx: EditorialPermissionContext,
  bookId: string,
  stage: EditorialStage
): Promise<boolean> {
  if (ctx.orgRole === "superadmin" || ctx.orgRole === "admin") {
    return true;
  }
  if (ctx.orgRole !== "ops") {
    return false;
  }
  // Ops can manage checklist if they are assigned to this stage
  const { data: member } = await ctx.supabase
    .from("editorial_book_members")
    .select("assigned_stages, editorial_role")
    .eq("book_id", bookId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!member) return false;
  if (!member.assigned_stages || member.assigned_stages.length === 0) return true;
  return member.assigned_stages.includes(stage);
}

/**
 * Whether a user may resolve alerts.
 */
export function canResolveAlerts(orgRole: AppRole): boolean {
  return ["superadmin", "admin", "ops"].includes(orgRole);
}

// ---- Internal helper ----

async function checkBookMemberFlag(
  supabase: SupabaseClient,
  bookId: string,
  userId: string,
  flag: "can_advance_stage" | "can_reopen_stage" | "can_override_rules"
): Promise<boolean> {
  const { data } = await supabase
    .from("editorial_book_members")
    .select("can_advance_stage, can_reopen_stage, can_override_rules")
    .eq("book_id", bookId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data as Record<string, unknown> | null)?.[flag] === true;
}
