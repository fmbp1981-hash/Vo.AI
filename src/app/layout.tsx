import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/auth-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vo.AI - Plataforma SaaS para AGIR Viagens",
  description: "CRM Kanban inteligente, chatbot IA omnicanal e motor automático de roteirização para AGIR Viagens",
  keywords: ["Vo.AI", "AGIR Viagens", "CRM", "Chatbot IA", "Roteirização", "SaaS"],
  authors: [{ name: "Vo.AI Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Vo.AI - Plataforma para AGIR Viagens",
    description: "Sistema completo de gestão com IA para agências de viagens",
    url: "https://voai.agir.com.br",
    siteName: "Vo.AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vo.AI - Plataforma para AGIR Viagens",
    description: "CRM inteligente e automação para agências de viagens",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
