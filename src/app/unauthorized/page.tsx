import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-10">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-slate-600">Your account does not have permission to access this area.</p>
        <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
