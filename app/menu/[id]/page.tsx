"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  id: string
  name_de: string
  name_tr: string
  description_de: string
  description_tr: string
  price: number
  image_url: string | null
  is_available: boolean
  category: string
}

type Language = "de" | "tr"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Language>("de")

  useEffect(() => {
    async function fetchProduct() {
      const productId = params.id as string
      if (!productId) return
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (!error && data) {
        setProduct(data)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-muted/40 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="w-full max-w-[320px] aspect-square mx-auto rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-muted-foreground">Produkt nicht gefunden.</p>
        <button onClick={() => router.back()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium">
          Zurück zur Karte
        </button>
      </main>
    )
  }

  const name = lang === "de" ? product.name_de : product.name_tr
  const description = lang === "de" ? product.description_de : product.description_tr

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm font-semibold hover:bg-muted px-3 py-2 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {lang === "de" ? "Zurück" : "Geri"}
        </button>

        <div className="inline-flex rounded-lg border bg-background p-1 gap-1">
          {(["de", "tr"] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {l === "de" ? "DE" : "TR"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center px-4 pt-8 pb-4">
          <div className="relative w-full max-w-[280px] sm:max-w-[160px] aspect-square bg-muted rounded-2xl border shadow-md overflow-hidden">
            {product.image_url ? (
              <Image src={product.image_url} alt={name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-sm">
                Kein Bild
              </div>
            )}
            {!product.is_available && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                <Badge variant="destructive" className="text-sm px-3 py-1.5 shadow-xl text-center leading-tight">
                  {lang === "de" ? "Zurzeit nicht verfügbar" : "Şu an mevcut değil"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
              {name}
            </h1>
            <span className="text-2xl font-black text-primary tabular-nums shrink-0">
              {product.price.toFixed(2).replace(".", ",")} €
            </span>
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {product.category}
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-bold text-muted-foreground mb-3">
              {lang === "de" ? "Beschreibung" : "Açıklama"}
            </h3>
            {description ? (
              <p className="text-base text-foreground/90 leading-relaxed">
                {description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {lang === "de" ? "Keine Beschreibung verfügbar." : "Açıklama bulunmuyor."}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}