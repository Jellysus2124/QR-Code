"use client";

import { FormEvent, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken || type !== "magiclink") return;

    const supabase = createClient();
    void supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          setError("Dang nhap that bai. Vui long thu lai.");
          return;
        }
        window.history.replaceState({}, document.title, "/dashboard");
        router.replace("/dashboard");
        router.refresh();
      });
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await res.json()) as { ok: boolean; message: string };
      if (!payload.ok) {
        setError(payload.message);
      } else {
        setMessage(payload.message);
      }
    } catch {
      setError("Khong gui duoc link. Thu lai sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-10">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Dang nhap bang email</h1>
        <p className="mt-2 text-sm text-slate-600">
          Nhap email da dang ky trong he thong. Ban se nhan duoc magic link.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="email@example.com"
            />
          </label>

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {loading ? "Dang gui..." : "Gui magic link"}
          </button>
        </form>

        {message && <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-900">{error}</p>}
      </div>
    </main>
  );
}
