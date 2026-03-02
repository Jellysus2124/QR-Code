"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function ContributorPanel({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const markRead = async (id: string) => {
    setLoading(true);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(item.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
              </p>
            </div>
            {!item.is_read && (
              <button
                disabled={loading}
                onClick={() => markRead(item.id)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
              >
                Da doc
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
