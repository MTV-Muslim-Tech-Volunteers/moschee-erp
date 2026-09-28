import React, { useEffect, useRef, useState } from 'react'
import { formatTime, timeSince } from '@/lib/kitchen'

export default function OrderCard({ order, onTogglePaid, onToggleReady, onDeleteOrder }: { order: any; onTogglePaid: (id: string, current: boolean) => void; onToggleReady: (id: string, current: boolean) => void; onDeleteOrder: (id: string) => void }) {
  const [toggling, setToggling] = useState(false)
  const [now, setNow] = useState(Date.now())
  
  // Double-Click states
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const cancelTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (order.is_ready) return
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [order.is_ready])

  // Clean up timeout
  useEffect(() => {
    return () => {
      if (cancelTimeoutRef.current) window.clearTimeout(cancelTimeoutRef.current)
    }
  }, [])

  const hasUnavailable = order.order_items.some((i: any) => i.products && !i.products.is_available)
  const elapsedMinutes = Math.floor((now - new Date(order.created_at).getTime()) / 60000)

  let borderColor = 'border-primary/30'
  let headerBg = 'bg-primary/5'
  let pingColor = 'bg-primary'

  if (order.is_ready) {
    borderColor = 'border-emerald-500/35'
    headerBg = 'bg-emerald-500/10'
  } else if (hasUnavailable) {
    borderColor = 'border-red-400/55'
    headerBg = 'bg-red-500/5'
    pingColor = 'bg-red-500'
  } else {
    if (elapsedMinutes >= 30) {
      borderColor = 'border-red-500/60'
      headerBg = 'bg-red-500/10'
      pingColor = 'bg-red-500'
    } else if (elapsedMinutes >= 15) {
      borderColor = 'border-[#d9a36c]/60'
      headerBg = 'bg-[#d9a36c]/10'
      pingColor = 'bg-[#d9a36c]'
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

  // Double Click Logic
  function handleDeleteClick() {
    if (isCancelling || toggling) return
    
    if (confirmCancel) {
      // Zweiter Klick -> Ausführen
      if (cancelTimeoutRef.current) window.clearTimeout(cancelTimeoutRef.current)
      setConfirmCancel(false)
      setIsCancelling(true)
      void Promise.resolve(onDeleteOrder(order.id)).finally(() => {
        setIsCancelling(false)
      })
    } else {
      // Erster Klick -> Bestätigungs-State für 3 Sekunden anzeigen
      setConfirmCancel(true)
      cancelTimeoutRef.current = window.setTimeout(() => {
        setConfirmCancel(false)
      }, 3000)
    }
  }

  return (
    <div className={`h-full rounded-2xl border bg-[#191512] shadow-[0_18px_40px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col transition-all duration-300 ${borderColor}`}>
      <div className={`flex items-start justify-between gap-3 border-b border-[#2a221c] px-3.5 pb-2.5 pt-3 transition-colors ${headerBg}`}>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            {!order.is_ready && (
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${pingColor}`} />
              </span>
            )}
            <h3 className="truncate text-[15px] font-bold leading-tight text-stone-50">{order.customer_name ?? 'Unbekannt'}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-stone-400">
            <span>{formatTime(order.created_at)}</span>
            <span>·</span>
            <span className={elapsedMinutes >= 15 && !order.is_ready ? 'font-bold text-[#f08f72]' : ''}>{timeSince(order.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[15px] font-bold tabular-nums text-stone-50">{(order.total_price ?? 0).toFixed(2).replace('.', ',')} €</span>
          <div className="flex flex-wrap items-end justify-end gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${order.is_ready ? 'bg-emerald-500/15 text-emerald-300' : 'bg-sky-500/15 text-sky-300'}`}>{order.is_ready ? 'Fertig' : 'Zubereitung'}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${order.is_paid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{order.is_paid ? 'Bezahlt' : 'Offen'}</span>
            {hasUnavailable && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300">Artikel nicht verfügbar</span>}
          </div>
        </div>
      </div>

      <div className="order-items-scrollbar flex-1 min-h-0 space-y-1 overflow-y-auto px-3.5 py-2.5">
        {order.order_items.map((item: any) => {
          const unavailable = item.products && !item.products.is_available
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#14110e] px-2.5 py-1.5 text-[13px]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2f261f] text-[12px] font-bold text-stone-100">{item.quantity}×</span>
                <span className={`min-w-0 truncate ${unavailable ? 'line-through text-stone-500' : 'text-stone-200'}`}>{item.products?.name_de ?? 'Unbekanntes Produkt'}</span>
                {unavailable && <span className="rounded px-1 font-medium text-[10px] bg-red-500/15 text-red-300">n.v.</span>}
              </div>
              <span className={`tabular-nums text-[12px] ${unavailable ? 'line-through text-stone-500' : 'text-stone-400'}`}>{(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')} €</span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 px-3.5 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleToggleReady} disabled={toggling} className={`min-h-11 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] ${order.is_ready ? 'bg-[#2a221b] text-stone-300 hover:bg-[#322921]' : 'bg-[#d9a36c] text-[#20150d] hover:bg-[#e0b072]'}`}>{order.is_ready ? 'Wieder in Arbeit' : 'Fertig'}</button>
          
          <button
            onClick={handleDeleteClick}
            disabled={toggling || isCancelling}
            className="group relative min-h-11 overflow-hidden rounded-xl px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] bg-red-500/10 text-red-300 hover:bg-red-500/18 touch-none select-none"
            type="button"
          >
            <span className="relative z-10">
              {isCancelling ? 'Storniert...' : confirmCancel ? 'Erneut drücken' : 'Stornieren'}
            </span>
          </button>
        </div>
        <button onClick={handleTogglePaid} disabled={toggling} className={`min-h-11 w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${order.is_paid ? 'bg-[#2a221b] text-stone-300 hover:bg-[#322921]' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>{order.is_paid ? 'Unbezahlt' : 'Bezahlt'}</button>
      </div>
    </div>
  )
}