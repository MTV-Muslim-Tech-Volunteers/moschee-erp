"use client"

import ProductCard from "@/components/menu/ProductCard"
import { translateCategory, type CartItem, type Language, type Product } from "@/lib/menu"

export default function MenuProductSections({ grouped, lang, cart, onAdd }: { grouped: Record<string, Product[]>; lang: Language; cart: CartItem[]; onAdd: (product: Product) => void }) {
  return (
    <>
      {Object.keys(grouped).map((category) => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-400/70 pb-3"><h2 className="text-xl font-semibold tracking-tight">{translateCategory(category, lang)}</h2></div>
          <div className="grid grid-cols-2 gap-4">
            {grouped[category].map((product) => <ProductCard key={product.id} product={product} lang={lang} onAdd={onAdd} cartQty={cart.find((item) => item.product.id === product.id)?.quantity ?? 0} />)}
          </div>
        </section>
      ))}
    </>
  )
}
