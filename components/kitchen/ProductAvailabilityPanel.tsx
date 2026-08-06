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
    <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 gap-3">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left">
          <span className="text-base font-semibold">Produktverfügbarkeit</span>
          {unavailableCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shrink-0">{unavailableCount} inaktiv</span>}
        </button>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          <button onClick={handleToggleAll} disabled={togglingAll || products.length === 0} className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${allAvailable ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}>
            {allAvailable ? 'Alle deaktivieren' : 'Alle aktivieren'}
          </button>
          <button onClick={() => setOpen((v) => !v)} className="w-full sm:w-auto text-muted-foreground text-sm hover:text-foreground transition-colors px-1 text-left sm:text-right">{open ? 'Zuklappen' : 'Aufklappen'}</button>
        </div>
      </div>

      {open && (
        <div className="border-t divide-y">
          {products.length === 0 && <p className="text-sm text-muted-foreground px-5 py-4">Keine Produkte gefunden.</p>}
          {products.map((product) => (
            <div key={product.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${!product.is_available ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${product.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className={`text-sm font-medium leading-tight ${!product.is_available ? 'line-through text-muted-foreground' : ''}`}>{product.name_de}</p>
                  {product.name_tr && <p className="text-xs text-muted-foreground">{product.name_tr}</p>}
                </div>
              </div>

              <button onClick={() => handleToggle(product.id, product.is_available)} disabled={toggling === product.id} className={`ml-4 shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${product.is_available ? 'bg-green-500' : 'bg-red-400'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${product.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
