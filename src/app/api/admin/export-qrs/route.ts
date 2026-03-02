import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getApiSession } from "@/lib/api-auth";

type ExportBody = {
  codes?: string[];
};

function normalizeCodes(codes: string[]) {
  return [...new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean))];
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session.user || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Khong co quyen." }, { status: 403 });
  }

  const body = (await request.json()) as ExportBody;
  const rawCodes = body.codes ?? [];
  const codes = normalizeCodes(rawCodes);

  if (codes.length === 0) {
    return NextResponse.json({ ok: false, message: "Khong co QR nao duoc chon." }, { status: 400 });
  }

  if (codes.length > 300) {
    return NextResponse.json({ ok: false, message: "Toi da 300 QR moi lan export." }, { status: 400 });
  }

  const { data: qrs, error } = await session.supabase
    .from("qr_codes")
    .select("code")
    .in("code", codes)
    .order("code", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, message: "Khong lay duoc du lieu QR." }, { status: 500 });
  }

  if (!qrs || qrs.length === 0) {
    return NextResponse.json({ ok: false, message: "Khong tim thay QR hop le." }, { status: 404 });
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 28;
  const cols = 3;
  const rows = 4;
  const gapX = 14;
  const gapY = 14;
  const cardWidth = (pageWidth - margin * 2 - gapX * (cols - 1)) / cols;
  const cardHeight = (pageHeight - margin * 2 - gapY * (rows - 1)) / rows;
  const qrSize = Math.min(cardWidth - 20, cardHeight - 46);

  for (let i = 0; i < qrs.length; i += 1) {
    if (i % (cols * rows) === 0) {
      doc.addPage([pageWidth, pageHeight]);
    }

    const page = doc.getPages()[doc.getPages().length - 1];
    const slot = i % (cols * rows);
    const row = Math.floor(slot / cols);
    const col = slot % cols;

    const x = margin + col * (cardWidth + gapX);
    const y = pageHeight - margin - (row + 1) * cardHeight - row * gapY;

    page.drawRectangle({
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      borderColor: rgb(0.8, 0.84, 0.9),
      borderWidth: 1,
    });

    const pngDataUrl = await QRCode.toDataURL(qrs[i].code, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 500,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    const pngBytes = Uint8Array.from(Buffer.from(pngDataUrl.split(",")[1], "base64"));
    const pngImage = await doc.embedPng(pngBytes);

    const qrX = x + (cardWidth - qrSize) / 2;
    const qrY = y + 24;
    page.drawImage(pngImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    page.drawText(qrs[i].code, {
      x: x + 10,
      y: y + 8,
      size: 12,
      font,
      color: rgb(0.06, 0.1, 0.16),
    });
  }

  const pdfBytes = await doc.save();
  const pdfArrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="qr-codes-${qrs.length}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
