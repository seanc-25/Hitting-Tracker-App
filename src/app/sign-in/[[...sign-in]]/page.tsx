"use client"

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function SignInRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard when user is already signed in
    console.log('SignInRedirect: redirecting to dashboard');
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <SignedIn>
        <SignInRedirect />
      </SignedIn>
      
      <SignedOut>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-400">Sign in to continue tracking your performance</p>
            </div>
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors",
                  card: "bg-gray-900 border border-gray-700 shadow-xl",
                  headerTitle: "text-white text-2xl font-bold",
                  headerSubtitle: "text-gray-400",
                  socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                  formFieldInput: "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500",
                  footerActionLink: "text-blue-400 hover:text-blue-300",
                  identityPreviewText: "text-gray-300",
                  formFieldLabel: "text-gray-300",
                  resendCodeLink: "text-blue-400 hover:text-blue-300 underline",
                  alternativeMethodsBlockButton: "text-blue-400 hover:text-blue-300",
                  formFieldWarningText: "text-yellow-400",
                  formFieldSuccessText: "text-green-400"
                }
              }}
            />
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <a href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
