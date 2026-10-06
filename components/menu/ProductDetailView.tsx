"use client"

import Image from "next/image"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { Language, Product } from "@/lib/menu"

export default function ProductDetailView({
  product,
  lang,
  onBack,
  onLanguageChange,
}: {
  product: Product
  lang: Language
  onBack: () => void
  onLanguageChange: (language: Language) => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const name = lang === "de" ? product.name_de : product.name_tr
  const description = lang === "de" ? product.description_de : product.description_tr

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {lang === "de" ? "Zurück" : "Geri"}
        </button>

        <div className="inline-flex gap-1 rounded-lg border bg-background p-1">
          {(["de", "tr"] as Language[]).map((language) => (
            <button
              key={language}
              onClick={() => onLanguageChange(language)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${lang === language ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {language === "de" ? "DE" : "TR"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center px-4 pb-4 pt-8">
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border bg-muted shadow-md sm:max-w-[160px]">
            {product.image_url && !imageFailed ? (
              <Image src={product.image_url} alt={name} fill className="object-cover" priority onError={() => setImageFailed(true)} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground/30">Kein Bild</div>
            )}
            {!product.is_available && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Badge variant="destructive" className="px-3 py-1.5 text-center text-sm leading-tight shadow-xl">
                  {lang === "de" ? "Zurzeit nicht verfügbar" : "Şu an mevcut değil"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground">{name}</h1>
            <span className="shrink-0 text-2xl font-black tabular-nums text-primary">{product.price.toFixed(2).replace(".", ",")} €</span>
          </div>

          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{product.category}</div>

          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-bold text-muted-foreground">{lang === "de" ? "Beschreibung" : "Açıklama"}</h3>
            {description ? (
              <p className="text-base leading-relaxed text-foreground/90">{description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">{lang === "de" ? "Keine Beschreibung verfügbar." : "Açıklama bulunmuyor."}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}