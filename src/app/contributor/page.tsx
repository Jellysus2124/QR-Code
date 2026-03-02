import { ContributorPanel } from "@/components/contributor-panel";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ContributorPage() {
  const user = await requireRole(["contributor", "admin"]);
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,body,is_read,created_at")
    .eq("recipient_email", user.email)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Tai khoan contributor</h1>
          <p className="text-sm text-slate-600">Email: {user.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="mb-3 text-lg font-bold">Thong bao qua da duoc trao</h2>
        {notifications && notifications.length > 0 ? (
          <ContributorPanel items={notifications} />
        ) : (
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600">Chua co thong bao nao.</p>
        )}
      </section>
    </main>
  );
}
