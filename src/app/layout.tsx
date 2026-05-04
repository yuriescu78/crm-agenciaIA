import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/lib/auth-context";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusCRM | Agencia de Alto Impacto",
  description: "Sistema inteligente de gestión de clientes y proyectos mediante IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} antialiased font-sans bg-background`}>
        <AuthProvider>
          <AuthWrapper>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </AuthWrapper>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
