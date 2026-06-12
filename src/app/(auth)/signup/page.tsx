import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isDemoMode } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <AuthShell
      title="ثبت‌نام وکیل"
      subtitle="در چند ثانیه دفتر دیجیتال خود را بسازید"
      footer={
        <>
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="font-bold text-accent hover:underline">
            ورود
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" demo={isDemoMode()} />
    </AuthShell>
  );
}
