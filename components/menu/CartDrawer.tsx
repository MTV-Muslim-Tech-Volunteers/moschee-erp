import React, { useState } from 'react'
import type { CartItem, TrackedOrder } from '@/lib/menu'
import type { Language } from '@/lib/menu'

export default function CartDrawer({
  cart,
  lang,
  open,
  onClose,
  onUpdateQty,
  onRemove,
  onOrder,
  onOrderSuccess,
}: {
  cart: CartItem[]
  lang: Language
  open: boolean
  onClose: () => void
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onOrder: (name: string) => Promise<void>
  onOrderSuccess: () => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  async function handleOrder() {
    if (!customerName.trim()) return
    setLoading(true)
    setError(null)
    try {
      await onOrder(customerName.trim())
      setCustomerName('')
      setLoading(false)
      onClose()
      onOrderSuccess()
    } catch {
      setError(lang === 'de' ? 'Bestellung fehlgeschlagen.' : 'Sipariş başarısız.')
      setLoading(false)
    }
  }

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-card z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold">{lang === 'de' ? 'Warenkorb' : 'Sepet'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-sm font-bold">X</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
              <p className="text-sm">{lang === 'de' ? 'Warenkorb ist leer' : 'Sepet boş'}</p>
            </div>
          ) : (
            cart.map((item) => {
              const name = lang === 'de' ? item.product.name_de : item.product.name_tr
              return (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onUpdateQty(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-background border flex items-center justify-center text-sm font-bold">-</button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-background border flex items-center justify-center text-sm font-bold">+</button>
                    <button onClick={() => onRemove(item.product.id)} className="w-7 h-7 text-destructive ml-1 text-xs font-bold">X</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t px-5 py-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">{lang === 'de' ? 'Gesamt' : 'Toplam'}</span>
              <span className="text-lg font-bold">{total.toFixed(2).replace('.', ',')} €</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{lang === 'de' ? 'Ihr Name *' : 'Adınız *'}</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={lang === 'de' ? 'z. B. Max Müller' : 'örn. Ali Yılmaz'}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/50 transition"
                onKeyDown={(e) => { if (e.key === 'Enter' && customerName.trim()) handleOrder() }}
              />
            </div>
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <button
              onClick={handleOrder}
              disabled={!customerName.trim() || loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all disabled:opacity-40"
            >
              {loading ? 'Lädt...' : lang === 'de' ? 'Jetzt bestellen' : 'Sipariş ver'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
