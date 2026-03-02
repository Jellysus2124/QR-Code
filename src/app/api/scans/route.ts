import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

function normalizeScanError(message: string) {
  if (message.includes("QR khong ton tai")) return "QR code does not exist.";
  if (message.includes("QR nay da duoc su dung")) return "This QR code has already been used.";
  if (message.includes("QR chua duoc gan cho contributor")) {
    return "This QR code is not assigned to a contributor yet.";
  }
  return message;
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.user || !["scanner", "admin"].includes(session.role ?? "")) {
    return NextResponse.json({ ok: false, message: "Not allowed to scan." }, { status: 403 });
  }

  const { code, schoolName, className } = (await request.json()) as {
    code?: string;
    schoolName?: string;
    className?: string;
  };

  if (!code || !schoolName || !className) {
    return NextResponse.json({ ok: false, message: "Missing scan information." }, { status: 400 });
  }

  const { error } = await session.supabase.rpc("process_qr_scan", {
    p_code: code.trim().toUpperCase(),
    p_scanner_id: session.user.id,
    p_school_name: schoolName.trim(),
    p_class_name: className.trim(),
  });

  if (error) {
    return NextResponse.json({ ok: false, message: normalizeScanError(error.message) }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `Kit ${code.trim().toUpperCase()} delivered to class ${className.trim()} at ${schoolName.trim()}.`,
  });
}
