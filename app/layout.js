import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mutarjim Sariʿ — مترجم سريع",
  description: "Tunesisch-deutsches Wörterbuch mit klarer Suche und persönlichem Wortschatz.",
  icons: {
    icon: "/mutarjim-sari-favicon-v3.ico",
    shortcut: "/mutarjim-sari-favicon-v3.ico",
    apple: "/mutarjim-sari-favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
