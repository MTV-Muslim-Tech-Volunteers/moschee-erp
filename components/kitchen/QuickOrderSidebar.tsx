"use client"

import type { Product } from "@/lib/menu"

interface SelectedItem {
  product: Product
  quantity: number
}

export default function QuickOrderSidebar({
  selectedList,
  total,
  submitting,
  onSubmit,
}: {
  selectedList: SelectedItem[]
  total: number
  submitting: boolean
  onSubmit: () => void
}) {
  return (
    <aside className="space-y-4 rounded-2xl border border-[#2c241d] bg-[#181411] p-4 lg:sticky lg:top-6 lg:self-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">Zusammenfassung</p>
        <h2 className="mt-1 text-lg font-semibold text-stone-100">Aktuelle Bestellung</h2>
      </div>

      <div className="space-y-3">
        {selectedList.length === 0 ? (
          <div className="rounded-2xl border border-[#2f261f] bg-[#1b1612] px-4 py-6 text-sm text-stone-400">Noch keine Produkte ausgewählt.</div>
        ) : (
          selectedList.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#2f261f] bg-[#1b1612] px-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-100">{product.name_de}</p>
                <p className="text-xs text-stone-400">{quantity} x {product.price.toFixed(2).replace('.', ',')} €</p>
              </div>
              <p className="shrink-0 font-semibold text-stone-100">{(product.price * quantity).toFixed(2).replace('.', ',')} €</p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-[#2f261f] bg-[#1b1612] px-4 py-4">
        <div className="flex items-center justify-between text-sm text-stone-400">
          <span>Gesamt</span>
          <span className="text-lg font-bold text-stone-100">{total.toFixed(2).replace('.', ',')} €</span>
        </div>
      </div>

      <button type="button" onClick={onSubmit} disabled={submitting || selectedList.length === 0} className="w-full rounded-xl bg-[#d9a36c] px-4 py-3 text-sm font-semibold text-[#24160e] transition-colors hover:bg-[#e4b37d] disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? 'Speichere...' : 'Bestellung anlegen'}
      </button>
    </aside>
  )
}