import Link from "next/link";
import { getSessionUser, getRoleHomePath } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  const homePath = user ? await getRoleHomePath(user.role) : "/login";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm sm:p-12">
        <p className="mb-3 inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900">
          QR Tracking System
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Theo doi bo dung cu hoc tap den tung hoc sinh
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
          Tao lo QR, gan QR cho nha tai tro, quet nhanh khi trao qua va gui thong bao ngay trong tai khoan
          contributor.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={homePath}
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {user ? "Vao bang dieu khien" : "Dang nhap"}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-100"
          >
            Nhan link dang nhap
          </Link>
        </div>
      </div>
    </main>
  );
}
