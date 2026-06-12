import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isDemoMode } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthShell
      title="ورود به سامانه"
      subtitle="میز کار حقوقی شما — پرونده‌ها، مواعد و دستیار هوشمند"
      footer={
        <>
          حساب ندارید؟{" "}
          <Link href="/signup" className="font-bold text-accent hover:underline">
            ثبت‌نام وکیل
          </Link>
        </>
      }
    >
      <AuthForm mode="login" demo={isDemoMode()} />
    </AuthShell>
  );
}
