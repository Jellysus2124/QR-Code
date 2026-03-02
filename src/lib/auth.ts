import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "scanner" | "contributor";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  fullName: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as AppRole | undefined) ?? "contributor";

  return {
    id: user.id,
    email: user.email,
    role,
    fullName: profile?.full_name ?? null,
  };
}

export async function requireRole(roles: AppRole[]) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (!roles.includes(sessionUser.role)) {
    redirect("/unauthorized");
  }

  return sessionUser;
}

export async function getRoleHomePath(role: AppRole): Promise<string> {
  if (role === "admin") return "/admin";
  if (role === "scanner") return "/scanner";
  return "/contributor";
}
