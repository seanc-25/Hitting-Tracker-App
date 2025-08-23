import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientProviders from "@/app/providers";

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
  console.log('🔍 [DEPLOYMENT DEBUG] RootLayout rendering')
  console.log('🔍 [DEPLOYMENT DEBUG] Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  })
  
  // TEMPORARY: Simplified layout for debugging
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-black text-white">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-blue-500 mb-4">🔍 Debug Layout</h1>
            <p className="text-gray-400 mb-4">Layout is rendering successfully</p>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>NODE_ENV: {process.env.NODE_ENV || 'undefined'}</li>
                <li>VERCEL_ENV: {process.env.VERCEL_ENV || 'undefined'}</li>
                <li>VERCEL_URL: {process.env.VERCEL_URL || 'undefined'}</li>
                <li>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}</li>
                <li>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}</li>
              </ul>
            </div>
            <div className="mt-4">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
