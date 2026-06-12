import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getDataSource } from "@/lib/data";
import { formatJalaliLong } from "@/lib/jalali";
import { isDemoMode } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await getDataSource();
  const [profile, notifications] = await Promise.all([db.getProfile(), db.listNotifications()]);
  const demo = isDemoMode();

  return (
    <div className="min-h-dvh">
      <Sidebar demoMode={demo} />
      <div className="md:ps-56">
        <Topbar
          profile={profile}
          notifications={notifications}
          todayFa={formatJalaliLong(new Date(), { weekday: true })}
        />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-6 md:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
