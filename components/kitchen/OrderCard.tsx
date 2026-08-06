import React, { useEffect, useState } from 'react'
import { formatTime, timeSince } from '@/lib/kitchen'

export default function OrderCard({ order, onTogglePaid, onToggleReady, onDeleteOrder }: { order: any; onTogglePaid: (id: string, current: boolean) => void; onToggleReady: (id: string, current: boolean) => void; onDeleteOrder: (id: string) => void }) {
  const [toggling, setToggling] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (order.is_ready) return
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [order.is_ready])

  const hasUnavailable = order.order_items.some((i: any) => i.products && !i.products.is_available)
  const elapsedMinutes = Math.floor((now - new Date(order.created_at).getTime()) / 60000)

  let borderColor = 'border-primary/30'
  let headerBg = 'bg-primary/5'
  let pingColor = 'bg-primary'

  if (order.is_ready) {
    borderColor = 'border-green-500/50'
    headerBg = 'bg-green-500/10'
  } else if (hasUnavailable) {
    borderColor = 'border-red-400/60'
    headerBg = 'bg-red-500/5'
    pingColor = 'bg-red-500'
  } else {
    if (elapsedMinutes >= 30) {
      borderColor = 'border-red-500/70'
      headerBg = 'bg-red-500/15'
      pingColor = 'bg-red-500'
    } else if (elapsedMinutes >= 15) {
      borderColor = 'border-amber-500/70'
      headerBg = 'bg-amber-500/15'
      pingColor = 'bg-amber-500'
    }
  }

  async function handleTogglePaid() {
    setToggling(true)
    await onTogglePaid(order.id, order.is_paid)
    setToggling(false)
  }

  async function handleToggleReady() {
    setToggling(true)
    await onToggleReady(order.id, order.is_ready)
    setToggling(false)
  }

  async function handleDelete() {
    if (!window.confirm('Bestellung wirklich stornieren?')) return
    setToggling(true)
    await onDeleteOrder(order.id)
  }

  return (
    <div className={`rounded-2xl border bg-card shadow-md shadow-black/20 overflow-hidden flex flex-col transition-all duration-300 ${borderColor}`}>
      <div className={`flex items-start justify-between px-4 pt-4 pb-3 border-b gap-3 transition-colors ${headerBg}`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {!order.is_ready && (
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${pingColor}`} />
              </span>
            )}
            <h3 className="font-bold text-base leading-tight">{order.customer_name ?? 'Unbekannt'}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTime(order.created_at)}</span>
            <span>·</span>
            <span className={elapsedMinutes >= 15 && !order.is_ready ? 'text-red-500 font-bold' : ''}>{timeSince(order.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-lg font-bold tabular-nums">{(order.total_price ?? 0).toFixed(2).replace('.', ',')} €</span>
          <div className="flex flex-col gap-1 items-end">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.is_ready ? 'bg-green-500/20 text-green-600' : 'bg-blue-500/20 text-blue-600'}`}>{order.is_ready ? 'Fertig' : 'Zubereitung'}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.is_paid ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/20 text-amber-600'}`}>{order.is_paid ? 'Bezahlt' : 'Offen'}</span>
            {hasUnavailable && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-500/15 text-red-600">Artikel nicht verfügbar</span>}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex-1 space-y-1.5">
        {order.order_items.map((item: any) => {
          const unavailable = item.products && !item.products.is_available
          return (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{item.quantity}×</span>
                <span className={unavailable ? 'line-through text-muted-foreground' : 'text-foreground/90'}>{item.products?.name_de ?? 'Unbekanntes Produkt'}</span>
                {unavailable && <span className="text-[10px] bg-red-500/15 text-red-600 rounded px-1 font-medium">n.v.</span>}
              </div>
              <span className={`tabular-nums ${unavailable ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground'}`}>{(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')} €</span>
            </div>
          )
        })}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleToggleReady} disabled={toggling} className={`py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${order.is_ready ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>{order.is_ready ? 'Wieder in Arbeit' : 'Fertig'}</button>

          <button onClick={handleDelete} disabled={toggling} className="py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] bg-destructive/10 text-destructive hover:bg-destructive/20">Stornieren</button>
        </div>

        <button onClick={handleTogglePaid} disabled={toggling} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${order.is_paid ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-green-500 text-white hover:bg-green-600'}`}>{order.is_paid ? 'Als unbezahlt markieren' : 'Als bezahlt markieren'}</button>
      </div>
    </div>
  )
}
