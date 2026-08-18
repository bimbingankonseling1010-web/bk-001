import type { Metadata } from "next";
import { Manrope, Work_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BK SD Portal - Bimbingan Konseling Sekolah Dasar",
  description: "Sistem Pengelolaan Bimbingan Konseling, Multi-Tenant SD, Catatan Pelanggaran Siswa & Import Export Excel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${manrope.variable} ${workSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-['Work_Sans'] bg-[#f8f9ff] text-[#0b1c30]">
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
