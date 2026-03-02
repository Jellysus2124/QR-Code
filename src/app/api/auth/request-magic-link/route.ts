import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ ok: false, message: "Email khong hop le." }, { status: 400 });
  }

  const staffAllowlist = (process.env.STAFF_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const admin = createAdminClient();
  const [contributors, profiles] = await Promise.all([
    admin.from("contributors").select("id").eq("email", normalizedEmail).maybeSingle(),
    admin.from("profiles").select("id").eq("email", normalizedEmail).in("role", ["admin", "scanner"]).maybeSingle(),
  ]);

  const isAllowed = Boolean(contributors.data || profiles.data || staffAllowlist.includes(normalizedEmail));
  if (!isAllowed) {
    return NextResponse.json(
      {
        ok: false,
        message: "Email chua duoc duyet. Vui long lien he admin.",
      },
      { status: 403 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, message: "Thieu cau hinh Supabase." }, { status: 500 });
  }

  const supabase = createClient(url, anonKey);
  const origin = new URL(request.url).origin;

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: `Khong gui duoc magic link: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Da gui magic link. Vui long kiem tra email.",
  });
}
