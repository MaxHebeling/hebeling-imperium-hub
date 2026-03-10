// =========================
// Fase 3: Reino Editorial Staff Dashboard
// Types for staff_profiles and editorial_staff_assignments
// and visibility controls for editorial_files / editorial_comments
// =========================

// --------------------------
// Primitive union types
// --------------------------

/** Role of an internal editorial staff member. */
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

/** Visibility level for editorial files. */
export type FileVisibility = 'staff' | 'author' | 'public'

/** Visibility level for editorial comments. */
export type CommentVisibility = 'staff' | 'author'

// --------------------------
// Table interfaces
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
