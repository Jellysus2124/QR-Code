import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.user || !["scanner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ ok: false, message: "Khong co quyen quet." }, { status: 403 });
  }

  const { code, schoolName, className } = (await request.json()) as {
    code?: string;
    schoolName?: string;
    className?: string;
  };

  if (!code || !schoolName || !className) {
    return NextResponse.json({ ok: false, message: "Thieu thong tin quet." }, { status: 400 });
  }

  const { data, error } = await session.supabase.rpc("process_qr_scan", {
    p_code: code.trim().toUpperCase(),
    p_scanner_id: session.user.id,
    p_school_name: schoolName.trim(),
    p_class_name: className.trim(),
  });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: data?.message ?? "Quet thanh cong.",
  });
}
