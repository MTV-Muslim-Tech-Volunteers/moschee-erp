"use client"

import Image from "next/image"
import LoginForm from "@/components/login/LoginForm"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ── Header ── */}
        <div className="flex flex-col items-center justify-center p-8 border-b bg-muted/20">
          <div className="w-20 h-20 bg-background rounded-full border shadow-sm flex items-center justify-center mb-5 relative overflow-hidden">
            <Image 
              src="/ditib-gk-logo.png" 
              alt="Logo" 
              fill 
              className="object-cover" 
              priority 
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Login
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            Bitte melde dich an, um auf die Verwaltung und die Küche zuzugreifen.
          </p>
        </div>

        {/* ── Formular ── */}
        <div className="p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}