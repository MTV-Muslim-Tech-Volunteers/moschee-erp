"use client"

import { Minus, Plus } from "lucide-react"
import type { Product } from "@/lib/menu"

type SelectedItems = Record<string, number>

export default function QuickOrderProductGrid({
  groupedProducts,
  selectedItems,
  loading,
  onAdjustQuantity,
}: {
  groupedProducts: Record<string, Product[]>
  selectedItems: SelectedItems
  loading: boolean
  onAdjustQuantity: (productId: string, delta: number) => void
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-[#2f261f] bg-[#1b1612]" />
        ))}
      </div>
    )
  }

  if (Object.keys(groupedProducts).length === 0) {
    return <div className="rounded-2xl border border-[#2f261f] bg-[#1b1612] px-4 py-8 text-center text-sm text-stone-400">Keine Produkte gefunden.</div>
  }

  return (
    <div className="space-y-5">
      {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
        <section key={category} className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#2c241d] pb-2">
            <h2 className="text-sm font-semibold tracking-wide text-stone-100">{category}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryProducts.map((product) => {
              const quantity = selectedItems[product.id] ?? 0

              return (
                <article key={product.id} className={`rounded-2xl border p-4 transition-colors ${product.is_available ? 'border-[#2f261f] bg-[#1b1612]' : 'border-[#3a241f] bg-[#221813] opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-stone-100">{product.name_de}</h3>
                      <p className="mt-1 text-xs text-stone-400">{product.category}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#2b221c] px-2.5 py-1 text-xs font-semibold text-stone-100">{product.price.toFixed(2).replace('.', ',')} €</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 text-xs text-stone-400">{product.is_available ? 'Verfügbar' : 'Nicht verfügbar'}</div>
                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                      <button type="button" onClick={() => onAdjustQuantity(product.id, -1)} disabled={quantity === 0} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#31271f] bg-[#120f0d] font-semibold text-stone-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-6 shrink-0 text-center text-sm font-semibold text-stone-100">{quantity}</div>
                      <button type="button" onClick={() => onAdjustQuantity(product.id, 1)} disabled={!product.is_available} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#5a4228] bg-[#d9a36c] font-semibold text-[#24160e] transition-colors hover:bg-[#e4b37d] disabled:cursor-not-allowed disabled:opacity-40">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}