import { Inter, Space_Grotesk } from "next/font/google";
import Navbar from "./components/navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });

export const metadata = {
  title: "CMS v2 — Contest Management System",
  description: "Host and run programming contests: participants submit C++ solutions, admins manage contests.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${display.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
