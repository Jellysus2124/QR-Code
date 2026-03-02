import { redirect } from "next/navigation";
import { getRoleHomePath, requireRole } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireRole(["admin", "scanner", "contributor"]);
  redirect(await getRoleHomePath(user.role));
}
