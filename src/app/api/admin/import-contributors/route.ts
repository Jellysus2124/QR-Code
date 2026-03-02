import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";

function parseCsvLine(line: string) {
  return line.split(",").map((item) => item.trim());
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.user || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  const { csv } = (await request.json()) as { csv?: string };
  if (!csv) {
    return NextResponse.json({ ok: false, message: "CSV is empty." }, { status: 400 });
  }

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return NextResponse.json({ ok: false, message: "CSV must contain at least one data row." }, { status: 400 });
  }

  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
  const emailIdx = headers.indexOf("email");
  const nameIdx = headers.indexOf("full_name");
  const quantityIdx = headers.indexOf("donation_quantity");

  if (emailIdx < 0 || quantityIdx < 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "CSV must contain email and donation_quantity columns.",
      },
      { status: 400 },
    );
  }

  const payload = lines.slice(1).flatMap((line) => {
    const cells = parseCsvLine(line);
    const email = cells[emailIdx]?.toLowerCase();
    const donationQuantity = Number(cells[quantityIdx] ?? 0);

    if (!email || Number.isNaN(donationQuantity) || donationQuantity < 0) {
      return [];
    }

    return [
      {
        email,
        full_name: nameIdx >= 0 ? cells[nameIdx] || null : null,
        donation_quantity: donationQuantity,
        imported_by: session.user!.id,
      },
    ];
  });

  if (payload.length === 0) {
    return NextResponse.json({ ok: false, message: "No valid rows to import." }, { status: 400 });
  }

  const { error } = await session.supabase.from("contributors").upsert(payload, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ ok: false, message: "Import failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Imported ${payload.length} contributor records.` });
}
