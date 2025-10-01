import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import ConditionalBottomNav from "@/components/ConditionalBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baseball Stats Tracker",
  description: "Track and analyze your baseball performance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baseball Stats",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Debug logging for production
  if (typeof window === 'undefined') {
    console.log('Layout: publishableKey exists:', !!publishableKey);
    console.log('Layout: publishableKey starts with:', publishableKey?.substring(0, 10));
    console.log('Layout: publishableKey length:', publishableKey?.length);
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {publishableKey ? (
          <ClerkProvider 
            publishableKey={publishableKey}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/onboarding"
          >
            {children}
            <ConditionalBottomNav />
          </ClerkProvider>
        ) : (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
