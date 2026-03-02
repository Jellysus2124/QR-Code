import { AdminPanel } from "@/components/admin-panel";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [{ data: contributors }, { data: qrs }] = await Promise.all([
    supabase
      .from("contributors")
      .select("id,email,full_name,donation_quantity")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("qr_codes")
      .select("id,code,status,assigned_email,used_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Manage contributors, QR codes, and kit allocation.</p>
        </div>
        <LogoutButton />
      </header>

      <AdminPanel contributors={contributors ?? []} qrs={qrs ?? []} />
    </main>
  );
}
