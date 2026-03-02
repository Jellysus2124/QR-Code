import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.user || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Khong co quyen." }, { status: 403 });
  }

  const { email, codes } = (await request.json()) as { email?: string; codes?: string[] };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !codes || codes.length === 0) {
    return NextResponse.json({ ok: false, message: "Thieu du lieu gan QR." }, { status: 400 });
  }

  const cleanCodes = [...new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean))];

  const { data: contributor } = await session.supabase
    .from("contributors")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!contributor) {
    return NextResponse.json({ ok: false, message: "Contributor khong ton tai." }, { status: 404 });
  }

  const { data: availableQrs } = await session.supabase
    .from("qr_codes")
    .select("id,code,status")
    .in("code", cleanCodes);

  const unavailable = (availableQrs ?? []).filter((item) => item.status !== "available").map((item) => item.code);

  if ((availableQrs?.length ?? 0) !== cleanCodes.length || unavailable.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "Mot so QR khong ton tai hoac khong con trang thai available.",
      },
      { status: 400 },
    );
  }

  const ids = (availableQrs ?? []).map((item) => item.id);

  const { error } = await session.supabase
    .from("qr_codes")
    .update({
      status: "assigned",
      assigned_email: normalizedEmail,
      assigned_by: session.user.id,
      assigned_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    return NextResponse.json({ ok: false, message: "Khong gan duoc QR." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Da gan ${ids.length} QR cho ${normalizedEmail}.` });
}
