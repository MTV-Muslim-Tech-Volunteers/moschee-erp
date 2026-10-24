"use client"

import Image from "next/image"
import type { Language } from "@/lib/menu"

export default function MenuHeader({ lang, onLanguageChange }: { lang: Language; onLanguageChange: (language: Language) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-full border border-[#d9a36c]/70 bg-white/60 p-1 shadow-[0_2px_8px_rgba(120,80,40,0.12)]">
        <Image src="/ditib-gk-logo.png" alt="Logo" width={80} height={80} className="rounded-full" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{lang === "de" ? "Speisekarte" : "Menü"}</h1>
      <div className="inline-flex gap-1 rounded-lg border border-[#31271f] bg-[#181411] p-1 shadow-sm">
        {(["de", "tr"] as Language[]).map((language) => (
          <button key={language} onClick={() => onLanguageChange(language)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${lang === language ? "bg-[#d9a36c] text-[#24160e]" : "text-stone-200 hover:bg-[#231b16]"}`}>
            {language === "de" ? "Deutsch" : "Türkçe"}
          </button>
        ))}
      </div>
    </div>
  )
}
