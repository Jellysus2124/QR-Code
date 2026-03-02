"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ScanItem = {
  code: string;
  status: "ok" | "error";
  message: string;
  time: string;
};

export function ScannerPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const busyRef = useRef(false);
  const recentRef = useRef<Map<string, number>>(new Map());

  const [schoolName, setSchoolName] = useState("");
  const [className, setClassName] = useState("");
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canScan = useMemo(() => schoolName.trim() && className.trim(), [schoolName, className]);

  useEffect(() => {
    let mounted = true;
    let controls: { stop: () => void } | null = null;

    async function start() {
      if (!videoRef.current || !canScan) return;

      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, async (result) => {
          if (!mounted || !result) return;

          const code = result.getText().trim();
          if (!code || busyRef.current) return;

          const now = Date.now();
          const last = recentRef.current.get(code) ?? 0;
          if (now - last < 3000) return;
          recentRef.current.set(code, now);

          busyRef.current = true;

          try {
            const res = await fetch("/api/scans", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                schoolName,
                className,
              }),
            });

            const payload = (await res.json()) as { message: string; ok: boolean };
            const status: ScanItem["status"] = payload.ok ? "ok" : "error";

            setItems((prev) => [
              {
                code,
                status,
                message: payload.message,
                time: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 20));
          } catch {
            setItems((prev) => [
              {
                code,
                status: "error" as const,
                message: "Loi ket noi. Thu lai.",
                time: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 20));
          } finally {
            busyRef.current = false;
          }
        });

        if (mounted) {
          setRunning(true);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Khong mo duoc camera. Vui long cap quyen camera.");
          setRunning(false);
        }
      }
    }

    void start();

    return () => {
      mounted = false;
      controls?.stop();
      setRunning(false);
    };
  }, [canScan, schoolName, className]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Ten truong</span>
          <input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="VD: THCS Nguyen Trai"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Lop</span>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="VD: 7A1"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      {!canScan && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Dien thong tin truong va lop truoc khi quet.
        </p>
      )}

      {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-900">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-black">
        <video ref={videoRef} className="h-[320px] w-full object-cover" muted playsInline />
      </div>

      <p className="text-sm text-slate-600">
        Trang thai: {running ? "Dang quet" : "Tam dung"}
      </p>

      <div className="space-y-2">
        <h3 className="text-base font-semibold">Ket qua gan day</h3>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={`${item.code}-${item.time}-${idx}`}
              className={`rounded-lg border px-3 py-2 text-sm ${
                item.status === "ok"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-rose-300 bg-rose-50 text-rose-900"
              }`}
            >
              <div className="font-semibold">{item.code}</div>
              <div>{item.message}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
