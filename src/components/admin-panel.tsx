"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Contributor = {
  id: string;
  email: string;
  full_name: string | null;
  donation_quantity: number;
};

type QRCode = {
  id: string;
  code: string;
  status: "available" | "assigned" | "used";
  assigned_email: string | null;
  used_at: string | null;
};

type Props = {
  contributors: Contributor[];
  qrs: QRCode[];
};

export function AdminPanel({ contributors, qrs }: Props) {
  const router = useRouter();
  const [count, setCount] = useState(100);
  const [prefix, setPrefix] = useState("KIT");
  const [assignEmail, setAssignEmail] = useState("");
  const [codesText, setCodesText] = useState("");
  const [csvText, setCsvText] = useState("email,full_name,donation_quantity\n");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const availableCount = useMemo(() => qrs.filter((item) => item.status === "available").length, [qrs]);
  const assignedCount = useMemo(() => qrs.filter((item) => item.status === "assigned").length, [qrs]);
  const usedCount = useMemo(() => qrs.filter((item) => item.status === "used").length, [qrs]);
  const visibleQrs = useMemo(() => qrs.slice(0, 50), [qrs]);

  const run = async (handler: () => Promise<{ ok: boolean; message: string }>) => {
    setLoading(true);
    setFeedback(null);
    setError(null);
    try {
      const result = await handler();
      if (!result.ok) setError(result.message);
      else {
        setFeedback(result.message);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    await run(async () => {
      const res = await fetch("/api/admin/generate-qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, prefix }),
      });
      return (await res.json()) as { ok: boolean; message: string };
    });
  };

  const onAssign = async (e: FormEvent) => {
    e.preventDefault();
    const codes = codesText
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    await run(async () => {
      const res = await fetch("/api/admin/assign-qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: assignEmail, codes }),
      });
      return (await res.json()) as { ok: boolean; message: string };
    });
  };

  const onImport = async (e: FormEvent) => {
    e.preventDefault();
    await run(async () => {
      const res = await fetch("/api/admin/import-contributors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      return (await res.json()) as { ok: boolean; message: string };
    });
  };

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  };

  const selectAllVisible = () => {
    setSelectedCodes(visibleQrs.map((item) => item.code));
  };

  const clearSelected = () => {
    setSelectedCodes([]);
  };

  const onExportPdf = async () => {
    if (selectedCodes.length === 0) {
      setError("Please select at least one QR code to export.");
      return;
    }

    setLoading(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/export-qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: selectedCodes }),
      });

      if (!res.ok) {
        const payload = (await res.json()) as { message?: string };
        setError(payload.message ?? "PDF export failed.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-codes-${selectedCodes.length}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedback(`Exported PDF for ${selectedCodes.length} QR codes.`);
    } catch {
      setError("Unable to download PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteSelected = async () => {
    if (selectedCodes.length === 0) {
      setError("Please select at least one QR code to delete.");
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedCodes.length} selected QR codes? This cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/delete-qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: selectedCodes }),
      });
      const payload = (await res.json()) as { ok: boolean; message: string };
      if (!payload.ok) {
        setError(payload.message);
        return;
      }
      setFeedback(payload.message);
      setSelectedCodes([]);
      router.refresh();
    } catch {
      setError("Unable to delete selected QR codes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Unassigned QR" value={availableCount} />
        <StatCard title="Assigned QR" value={assignedCount} />
        <StatCard title="Used QR" value={usedCount} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Generate QR batch</h2>
        <form onSubmit={onGenerate} className="mt-3 grid gap-3 sm:grid-cols-[160px_160px_auto]">
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="KIT"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Generate QR
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Import contributors from Google Form (CSV)</h2>
        <form onSubmit={onImport} className="mt-3 space-y-3">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={7}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Import
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Assign QR codes to contributors</h2>
        <form onSubmit={onAssign} className="mt-3 space-y-3">
          <select
            value={assignEmail}
            onChange={(e) => setAssignEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          >
            <option value="">Select contributor</option>
            {contributors.map((item) => (
              <option key={item.id} value={item.email}>
                {item.email} ({item.donation_quantity} kits)
              </option>
            ))}
          </select>
          <textarea
            required
            value={codesText}
            onChange={(e) => setCodesText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder="KIT-001, KIT-002"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Assign QR
          </button>
        </form>
      </section>

      {feedback && <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">{feedback}</p>}
      {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-900">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Export QR to A4 PDF</h2>
        <p className="mt-1 text-sm text-slate-600">Select QR codes below, then export a printable PDF file.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAllVisible}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Select all (50 visible QR)
          </button>
          <button
            type="button"
            onClick={clearSelected}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Clear selection
          </button>
          <button
            type="button"
            disabled={loading || selectedCodes.length === 0}
            onClick={onExportPdf}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Export PDF A4 ({selectedCodes.length})
          </button>
          <button
            type="button"
            disabled={loading || selectedCodes.length === 0}
            onClick={onDeleteSelected}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
          >
            Delete selected ({selectedCodes.length})
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Contributors</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {contributors.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <div className="font-semibold">{item.email}</div>
              <div className="text-slate-600">{item.full_name ?? "No name yet"}</div>
              <div className="text-slate-600">Kits funded: {item.donation_quantity}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Latest QR codes (select to export)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {visibleQrs.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedCodes.includes(item.code)}
                  onChange={() => toggleCode(item.code)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-mono font-semibold">{item.code}</span>
                  <span className="block text-slate-600">Status: {item.status}</span>
                  {item.assigned_email && (
                    <span className="block text-slate-600">Notification recipient: {item.assigned_email}</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
