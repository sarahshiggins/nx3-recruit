import { NextRequest } from "next/server";

/**
 * Check if the request has a valid admin session cookie.
 * Returns true if authenticated.
 */
export function isAdminAuthed(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "1";
}
