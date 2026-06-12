import { Scale } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
            <Scale className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-ink">ایرانمنش</p>
            <p className="text-[0.66rem] font-medium text-muted">سیستم‌عامل حقوقی وکلای ایران</p>
          </div>
        </div>
        <div className="card p-6">
          <h1 className="text-[0.95rem] font-bold text-ink">{title}</h1>
          <p className="mt-1 text-[0.7rem] text-muted">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
        <p className="mt-4 text-center text-[0.7rem] text-muted">{footer}</p>
      </div>
    </div>
  );
}
