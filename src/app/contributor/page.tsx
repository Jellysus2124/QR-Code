import { ContributorPanel } from "@/components/contributor-panel";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function localizeNotification(item: {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}) {
  let title = item.title;
  let body = item.body;

  if (title.toLowerCase() === "qua da duoc trao") {
    title = "Kit delivered";
  }

  const match = body.match(/^Bo qua (.+) da trao thanh cong cho hoc sinh lop (.+) - (.+)\.$/);
  if (match) {
    const [, code, className, schoolName] = match;
    body = `Kit ${code} was successfully delivered to class ${className} at ${schoolName}.`;
  }

  return { ...item, title, body };
}

export default async function ContributorPage() {
  const user = await requireRole(["contributor", "admin"]);
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,body,is_read,created_at")
    .eq("recipient_email", user.email)
    .order("created_at", { ascending: false })
    .limit(200);
  const localizedNotifications = (notifications ?? []).map(localizeNotification);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Contributor Account</h1>
          <p className="text-sm text-slate-600">Email: {user.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="mb-3 text-lg font-bold">Delivered kit notifications</h2>
        {localizedNotifications.length > 0 ? (
          <ContributorPanel items={localizedNotifications} />
        ) : (
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600">No notifications yet.</p>
        )}
      </section>
    </main>
  );
}
