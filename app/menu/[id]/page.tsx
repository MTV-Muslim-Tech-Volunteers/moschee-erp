"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import ProductDetailView from "@/components/menu/ProductDetailView"
import type { Language, Product } from "@/lib/menu"

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

  return <ProductDetailView product={product} lang={lang} onBack={() => router.back()} onLanguageChange={setLang} />
}