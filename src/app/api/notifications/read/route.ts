import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  const session = await getApiSession();

  if (!session.user || !session.user.email) {
    return NextResponse.json({ ok: false, message: "Chua dang nhap." }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ ok: false, message: "Thieu ID thong bao." }, { status: 400 });
  }

  const { error } = await session.supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_email", session.user.email);

  if (error) {
    return NextResponse.json({ ok: false, message: "Khong cap nhat duoc." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Da danh dau da doc." });
}
