import type { Metadata } from "next";
import "@fontsource/vazirmatn/300.css";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "ایرانمنش — سیستم‌عامل حقوقی", template: "%s | ایرانمنش" },
  description:
    "سیستم‌عامل حقوقی ایرانمنش — مدیریت پرونده، مواعد قانونی، تحلیل هوشمند و نگارش اسناد برای وکلای دادگستری ایران",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Toaster
          position="bottom-left"
          dir="rtl"
          toastOptions={{ style: { fontFamily: "Vazirmatn, sans-serif", fontSize: "0.82rem" } }}
        />
      </body>
    </html>
  );
}
