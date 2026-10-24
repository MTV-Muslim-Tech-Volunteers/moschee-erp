"use client"

import Image from "next/image"
import LoginForm from "@/components/login/LoginForm"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.12),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] p-4 text-stone-100">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2c241d] bg-[#181411] shadow-[0_18px_50px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ── Header ── */}
        <div className="flex flex-col items-center justify-center border-b border-[#2c241d] bg-[#15110e] p-8">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#d9a36c]/70 bg-white/80 shadow-sm">
            <Image 
              src="/ditib-gk-logo.png" 
              alt="Logo" 
              fill 
              className="object-cover" 
              priority 
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-100">
            System Login
          </h1>
          <p className="mt-1.5 text-center text-sm text-stone-400">
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