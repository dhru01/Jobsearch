import { redirect } from "next/navigation";

/** Documents live on the Profile tab; keep this route for old bookmarks. */
export default function DocumentsPage() {
  redirect("/dashboard/profile?tab=documents");
}
