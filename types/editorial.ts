// =========================
// Fase 3: Reino Editorial Staff Dashboard
// Types for staff_profiles, editorial_staff_assignments,
// and visibility controls for editorial_files / editorial_comments.
//
// Phase 1/2 table shapes (editorial_projects, editorial_stages,
// editorial_files, editorial_comments, author_profiles,
// editorial_project_members) are documented here with their
// assumed minimal columns. Adjust if the real schema differs.
// =========================

// --------------------------
// Primitive union types
// --------------------------

/** Role of an internal editorial staff member (staff_profiles.role). */
export type StaffRole =
  | 'editor'
  | 'reviewer'
  | 'coordinator'
  | 'designer'
  | 'proofreader'

/** Role of a staff member within a specific editorial project assignment. */
export type AssignmentRole =
  | 'lead_editor'
  | 'editor'
  | 'reviewer'
  | 'designer'
  | 'proofreader'
  | 'coordinator'

/** Status of a stage within the editorial pipeline. */
export type EditorialStageStatus = 'pending' | 'in_progress' | 'approved' | 'rejected'

/** Visibility level for editorial files. */
export type FileVisibility = 'staff' | 'author' | 'public'

/** Visibility level for editorial comments. */
export type CommentVisibility = 'staff' | 'author'

// --------------------------
// Phase 3 table interfaces
// --------------------------

/**
 * Represents a row in the `staff_profiles` table.
 * Links an auth.users account to an editorial staff role within an org.
 */
export interface StaffProfile {
  id: string
  org_id: string
  user_id: string
  full_name: string
  display_name: string | null
  role: StaffRole
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Represents a row in the `editorial_staff_assignments` table.
 * Links a staff profile to an editorial project with a specific role.
 */
export interface EditorialStaffAssignment {
  id: string
  org_id: string
  project_id: string | null
  staff_profile_id: string
  role: AssignmentRole
  assigned_by: string | null
  assigned_at: string
  notes: string | null
  created_at: string
  updated_at: string
}

// --------------------------
// Phase 1/2 table interfaces
// (assumed shape — adjust to match real schema if needed)
// --------------------------

/**
 * Assumed minimal shape of the `editorial_projects` table (Phase 1/2).
 * TODO: verify column list against actual DB schema.
 */
export interface EditorialProject {
  id: string
  org_id: string
  brand_id: string | null
  name: string
  status: string
  created_at: string
  updated_at: string
}

/**
 * Assumed shape of the `editorial_stages` table (Phase 1/2 base columns
 * plus Phase 3 columns added by migration 009).
 * TODO: verify base column list against actual DB schema.
 */
export interface EditorialStage {
  id: string
  project_id: string
  name: string
  position: number
  status: EditorialStageStatus
  // Phase 3 columns added by migration 009
  started_at: string | null
  approved_at: string | null
  approved_by: string | null
  assigned_to: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Assumed shape of the `editorial_files` table (Phase 1/2 base columns
 * plus Phase 3 visibility column added by migration 009).
 * TODO: verify base column list against actual DB schema.
 */
export interface EditorialFile {
  id: string
  project_id: string
  stage_id: string | null
  name: string
  file_url: string
  file_type: string | null
  size_bytes: number | null
  uploaded_by: string
  // Phase 3 column added by migration 009
  visibility: FileVisibility
  created_at: string
  updated_at: string
}

/**
 * Assumed shape of the `editorial_comments` table (Phase 1/2 base columns
 * plus Phase 3 visibility column added by migration 009).
 * TODO: verify base column list against actual DB schema.
 */
export interface EditorialComment {
  id: string
  project_id: string
  stage_id: string | null
  author_id: string
  content: string
  // Phase 3 column added by migration 009
  visibility: CommentVisibility
  created_at: string
  updated_at: string
}

/**
 * Assumed shape of the `author_profiles` table (Phase 1/2).
 * TODO: verify column list against actual DB schema.
 */
export interface AuthorProfile {
  id: string
  org_id: string
  user_id: string
  full_name: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Assumed shape of the `editorial_project_members` table (Phase 1/2).
 * Represents an author assigned to a project.
 * TODO: verify column list against actual DB schema.
 */
export interface EditorialProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  added_at: string
  added_by: string | null
}
