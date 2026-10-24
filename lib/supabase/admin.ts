import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export function createAdminClient() {
  return createServiceRoleClient();
}
