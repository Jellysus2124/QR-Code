"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
    >
      Log out
    </button>
  );
}
