import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Walas SMK",
  description: "Aplikasi Manajemen Wali Kelas, Absensi, dan Nilai Siswa SMK",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased font-mono`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
