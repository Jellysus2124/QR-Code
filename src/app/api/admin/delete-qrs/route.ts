import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

type DeleteBody = {
  codes?: string[];
};

function normalizeCodes(codes: string[]) {
  return [...new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean))];
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.user || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  const body = (await request.json()) as DeleteBody;
  const codes = normalizeCodes(body.codes ?? []);

  if (codes.length === 0) {
    return NextResponse.json({ ok: false, message: "No QR codes selected." }, { status: 400 });
  }

  if (codes.length > 300) {
    return NextResponse.json({ ok: false, message: "Maximum 300 QR codes per delete." }, { status: 400 });
  }

  const { data: qrs, error: fetchError } = await session.supabase
    .from("qr_codes")
    .select("id,code,status")
    .in("code", codes);

  if (fetchError) {
    return NextResponse.json({ ok: false, message: "Unable to fetch QR data." }, { status: 500 });
  }

  if (!qrs || qrs.length !== codes.length) {
    return NextResponse.json(
      { ok: false, message: "Some selected QR codes do not exist." },
      { status: 400 },
    );
  }

  const used = qrs.filter((item) => item.status === "used");
  if (used.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `Cannot delete used QR codes: ${used.map((item) => item.code).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const ids = qrs.map((item) => item.id);
  const { error: deleteError } = await session.supabase.from("qr_codes").delete().in("id", ids);

  if (deleteError) {
    return NextResponse.json({ ok: false, message: "Unable to delete selected QR codes." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Deleted ${ids.length} QR codes.` });
}
