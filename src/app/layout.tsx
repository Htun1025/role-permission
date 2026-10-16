import type { Metadata } from "next";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./globals.css";
import { PrimeReactProvider } from "primereact/api";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "Approval Management System",
  description: "Maker – Checker Approval Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PrimeReactProvider>
          <ToastProvider>{children}</ToastProvider>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
