import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "SIA - BGH",
  description: "Sistema de Inserción Automática - registro de producción SMD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-bgh-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
