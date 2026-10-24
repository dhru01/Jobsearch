import "server-only";

import { requireUser } from "@/lib/auth";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const allowed = adminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/** Ensures the signed-in user is listed in ADMIN_EMAILS. */
export async function requireAdminUser() {
  const { supabase, user } = await requireUser();
  if (!isAdminEmail(user.email)) {
    throw new Error("You do not have permission to run this action.");
  }
  if (adminEmails().length === 0) {
    throw new Error("ADMIN_EMAILS is not configured on the server.");
  }
  return { supabase, user };
}
