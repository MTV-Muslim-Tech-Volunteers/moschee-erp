import React, { useState, useMemo } from 'react'
import { getMonthlyOrdersData } from '@/app/kitchen/actions'
import { buildRevenueData, formatEur, monthLabel, weekLabel } from '@/lib/kitchen'

export default function RevenuePanel({ orders }: { orders: any[] }) {
  const [open, setOpen] = useState(false)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const data = useMemo(() => buildRevenueData(orders), [orders])
  const totalAll = useMemo(() => data.reduce((s: number, m: any) => s + m.total, 0), [data])

  const handleExportCSV = async (monthKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExporting(monthKey)

    try {
      const result = await getMonthlyOrdersData(monthKey)
      if (!result.success || !result.data) {
        alert('Fehler beim Exportieren: ' + result.error)
        return
      }

      const headers = ['Datum', 'Uhrzeit', 'Kunde', 'Summe (€)', 'Status', 'Artikel']
      const rows = result.data.map((order: any) => {
        const date = new Date(order.created_at)
        const dateStr = date.toLocaleDateString('de-DE')
        const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        const customer = order.customer_name || 'Unbekannt'
        const total = (order.total_price || 0).toFixed(2).replace('.', ',')
        const status = order.is_paid ? 'Bezahlt' : 'Offen'

        const items = order.order_items.map((item: any) => `${item.quantity}x ${item.products?.name_de || 'Unbekannt'}`).join('; ')

        return [
          `"${dateStr}"`,
          `"${timeStr}"`,
          `"${customer.replace(/"/g, '""')}"`,
          `"${total}"`,
          `"${status}"`,
          `"${items.replace(/"/g, '""')}"`
        ].join(',')
      })

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Bestellungen_${monthKey}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Ein Fehler ist beim CSV-Export aufgetreten.')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold">Einnahmen</span>
          <span className="text-sm text-muted-foreground font-normal">Gesamt: {formatEur(totalAll)}</span>
        </div>
        <span className="text-muted-foreground text-sm">{open ? 'Zuklappen' : 'Aufklappen'}</span>
      </button>

      {open && (
        <div className="border-t">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-4">Keine bezahlten Bestellungen vorhanden.</p>
          ) : (
            <div className="divide-y">
              {data.map((month: any) => (
                <div key={month.key}>
                  <button onClick={() => setExpandedMonth((v) => (v === month.key ? null : month.key))} className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{monthLabel(month.key)}</span>
                      <span className="text-xs text-muted-foreground">{month.orderCount} Bestellung{month.orderCount !== 1 ? 'en' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm tabular-nums text-green-600">{formatEur(month.total)}</span>
                      <button onClick={(e) => handleExportCSV(month.key, e)} disabled={isExporting === month.key} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors disabled:opacity-50" title="Als CSV herunterladen">
                        {isExporting === month.key ? '...' : 'CSV'}
                      </button>
                    </div>
                  </button>

                  {expandedMonth === month.key && (
                    <div className="bg-muted/30 divide-y divide-border/50">
                      {month.weeks.map((week: any) => (
                        <div key={week.key} className="flex items-center justify-between px-8 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-12">{weekLabel(week.key)}</span>
                            <span className="text-xs text-muted-foreground">· {week.orderCount} Bestellung{week.orderCount !== 1 ? 'en' : ''}</span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">{formatEur(week.total)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-8 py-2 bg-muted/60">
                        <span className="text-xs font-semibold text-muted-foreground">Monatsgesamt</span>
                        <span className="text-sm font-bold tabular-nums text-green-600">{formatEur(month.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t flex items-center justify-between px-5 py-3 bg-muted/20">
            <span className="text-sm font-semibold text-muted-foreground">Gesamteinnahmen</span>
            <span className="text-base font-bold tabular-nums text-green-600">{formatEur(totalAll)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
