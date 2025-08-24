import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientProviders from "@/app/providers";
import AuthDebug from "@/components/AuthDebug";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baseball Stats Tracker",
  description: "Track and analyze your baseball performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientProviders>
          <AuthProvider>
            <AuthWrapper>
              {children}
              <AuthDebug />
            </AuthWrapper>
          </AuthProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
