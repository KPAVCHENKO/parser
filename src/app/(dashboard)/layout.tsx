import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const plan = getPlan(user.subscription?.plan ?? "FREE");

  return (
    <div className="flex min-h-screen">
      {/* Десктоп-сайдбар */}
      <aside className="hidden w-60 shrink-0 border-r p-4 md:block">
        <Sidebar isAdmin={isAdmin} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar isAdmin={isAdmin} planName={plan.name} email={user.email} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
