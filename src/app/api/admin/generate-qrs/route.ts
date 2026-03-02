import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

function padNumber(value: number, width = 3) {
  return String(value).padStart(width, "0");
}

export async function POST(request: Request) {
  const session = await getApiSession();

  if (!session.user || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  const { count, prefix } = (await request.json()) as { count?: number; prefix?: string };
  const size = Math.min(Math.max(Number(count ?? 0), 1), 500);
  const qrPrefix = (prefix?.trim().toUpperCase() || "KIT").replace(/[^A-Z0-9_-]/g, "");

  const { data: lastItem } = await session.supabase
    .from("qr_codes")
    .select("sequence")
    .eq("prefix", qrPrefix)
    .order("sequence", { ascending: false })
    .limit(1)
    .maybeSingle();

  const start = (lastItem?.sequence ?? 0) + 1;

  const payload = Array.from({ length: size }).map((_, idx) => {
    const sequence = start + idx;
    return {
      code: `${qrPrefix}-${padNumber(sequence)}`,
      prefix: qrPrefix,
      sequence,
    };
  });

  const { error } = await session.supabase.from("qr_codes").insert(payload);

  if (error) {
    return NextResponse.json({ ok: false, message: "Unable to generate QR codes." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Generated ${size} new QR codes.` });
}
