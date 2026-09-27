import React, { useState, useMemo } from 'react'
import type { Product } from '@/lib/kitchen'

export default function ProductAvailabilityPanel({ products, onToggle, onToggleAll }: { products: Product[]; onToggle: (id: string, current: boolean) => Promise<void>; onToggleAll: (available: boolean) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [togglingAll, setTogglingAll] = useState(false)

  const unavailableCount = useMemo(() => products.filter((p) => !p.is_available).length, [products])
  const allAvailable = useMemo(() => unavailableCount === 0, [unavailableCount])

  async function handleToggle(id: string, current: boolean) {
    setToggling(id)
    await onToggle(id, current)
    setToggling(null)
  }

  async function handleToggleAll() {
    setTogglingAll(true)
    await onToggleAll(!allAvailable)
    setTogglingAll(false)
  }

  return (
    <div className="rounded-2xl border border-[#2c241d] bg-[#181411] shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => setOpen((v) => !v)} className="flex flex-1 min-w-0 items-center gap-2.5 text-left transition-opacity hover:opacity-80">
          <span className="text-base font-semibold text-stone-100">Produktverfügbarkeit</span>
          {unavailableCount > 0 && <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">{unavailableCount} inaktiv</span>}
        </button>

        <button onClick={() => setOpen((v) => !v)} className="w-full px-1 text-left text-sm text-stone-400 transition-colors hover:text-stone-100 sm:w-auto sm:text-right">{open ? 'Zuklappen' : 'Aufklappen'}</button>
      </div>

      {open && (
        <div className="border-t border-[#2c241d] divide-y divide-[#2c241d] bg-[#14110e]">
          <div className="px-5 py-4">
            <button
              onClick={handleToggleAll}
              disabled={togglingAll || products.length === 0}
              className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${allAvailable ? 'bg-red-500/10 text-red-300 hover:bg-red-500/18' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/18'}`}
            >
              {allAvailable ? 'Alle deaktivieren' : 'Alle aktivieren'}
            </button>
          </div>

          {products.length === 0 && <p className="px-5 py-4 text-sm text-stone-400">Keine Produkte gefunden.</p>}
          {products.map((product) => (
            <div key={product.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${!product.is_available ? 'bg-red-500/5' : 'bg-[#14110e]'}`}>
              <div className="flex items-center gap-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${product.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className={`text-sm font-medium leading-tight ${!product.is_available ? 'line-through text-stone-500' : 'text-stone-100'}`}>{product.name_de}</p>
                  {product.name_tr && <p className="text-xs text-stone-400">{product.name_tr}</p>}
                </div>
              </div>

              <button onClick={() => handleToggle(product.id, product.is_available)} disabled={toggling === product.id} className={`relative ml-4 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${product.is_available ? 'bg-emerald-500' : 'bg-red-400'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${product.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
