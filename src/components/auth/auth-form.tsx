"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode, demo }: { mode: "login" | "signup"; demo: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (demo) {
      router.push("/");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const fullName = String(fd.get("full_name") ?? "");
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("حساب ساخته شد — وارد شدید");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در احراز هویت");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      {demo && (
        <div className="rounded-xl border border-warn-line bg-warn-soft px-3.5 py-2.5 text-[0.68rem] leading-6 text-warn">
          <b>حالت نمایشی فعال است.</b> بدون نیاز به حساب، با دفتر وکالت نمونه وارد می‌شوید. برای ورود
          واقعی، متغیرهای Supabase را تنظیم کنید.
        </div>
      )}
      {mode === "signup" && !demo && (
        <div>
          <label className="label">نام و نام خانوادگی</label>
          <input name="full_name" required className="input" placeholder="دکتر مهدیه ایرانمنش" />
        </div>
      )}
      {!demo && (
        <>
          <div>
            <label className="label">ایمیل</label>
            <input name="email" type="email" required className="input" dir="ltr" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">گذرواژه</label>
            <input name="password" type="password" required minLength={8} className="input" dir="ltr" placeholder="حداقل ۸ نویسه" />
          </div>
        </>
      )}
      <Button type="submit" variant="primary" size="lg" disabled={busy} className="w-full gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {demo ? "ورود به نسخه نمایشی" : mode === "login" ? "ورود" : "ساخت حساب"}
      </Button>
      {!demo && (
        <p className="text-[0.6rem] leading-5 text-faint">
          داده‌های پرونده شما با Row-Level Security ایزوله است و فقط با حساب شما قابل دسترسی است.
        </p>
      )}
    </form>
  );
}
