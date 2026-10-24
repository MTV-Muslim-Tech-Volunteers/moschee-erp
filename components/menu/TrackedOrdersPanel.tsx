"use client"

import type { Language, TrackedOrder } from "@/lib/menu"

export default function TrackedOrdersPanel({ orders, lang, onClear }: { orders: TrackedOrder[]; lang: Language; onClear: () => void }) {
  return (
    <div className="relative space-y-3 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 animate-pulse bg-[#d9a36c]" />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{lang === "de" ? "Ihre aktiven Bestellungen" : "Aktif Siparişleriniz"}</h3>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:underline">{lang === "de" ? "Verlauf löschen" : "Geçmişi temizle"}</button>
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-xl border bg-muted/50 p-3 text-sm">
            <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString(lang === "de" ? "de-DE" : "tr-TR", { hour: "2-digit", minute: "2-digit" })} {lang === "de" ? "Uhr" : ""}</span>
            {order.is_cancelled ? (
              <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-600">{lang === "de" ? "Storniert" : "İptal edildi"}</span>
            ) : order.is_ready ? (
              <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-600">{lang === "de" ? "Abholbereit!" : "Teslim alınabilir!"}</span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-700"><span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-500" />{lang === "de" ? "Wird zubereitet..." : "Hazırlanıyor..."}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
