/**
 * @deprecated Use POST /api/editorial/projects instead.
 * This route is kept only to avoid 404s during the transition period.
 * It now delegates to the authenticated handler.
 */
export { POST } from "@/app/api/editorial/projects/route";
