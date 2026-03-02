import { LogoutButton } from "@/components/logout-button";
import { ScannerPanel } from "@/components/scanner-panel";
import { requireRole } from "@/lib/auth";

export default async function ScannerPage() {
  await requireRole(["scanner", "admin"]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Scanner Dashboard</h1>
          <p className="text-sm text-slate-600">Scan QR codes quickly during kit distribution.</p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <ScannerPanel />
      </section>
    </main>
  );
}
