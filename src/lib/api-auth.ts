import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth";

export async function getApiSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return { supabase, user: null, role: null as AppRole | null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: (profile?.role as AppRole | undefined) ?? "contributor",
  };
}
