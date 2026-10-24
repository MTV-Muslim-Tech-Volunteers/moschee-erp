import React, { useState, useMemo } from 'react'
import { getWeeklyOrdersData } from '@/app/kitchen/actions'
import { buildRevenueMonthWeekData, formatEur, monthLabel, weekLabel, type RevenueMonthWeekSummary, type RevenueOrder } from '@/lib/kitchen'

export default function RevenuePanel({ orders }: { orders: RevenueOrder[] }) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const data = useMemo(() => buildRevenueMonthWeekData(orders), [orders])
  const totalAll = useMemo(() => data.reduce((sum, month) => sum + month.total, 0), [data])

  const handleExportCSV = async (weekKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExporting(weekKey)

    try {
      const result = await getWeeklyOrdersData(weekKey)
      if (!result.success || !result.data) {
        alert('Fehler beim Exportieren: ' + result.error)
        return
      }

      const headers = ['Datum', 'Uhrzeit', 'Kunde', 'Summe (€)', 'Status', 'Artikel']
      const rows = result.data.map((order) => {
        const date = new Date(order.created_at)
        const dateStr = date.toLocaleDateString('de-DE')
        const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        const customer = order.customer_name || 'Unbekannt'
        const total = (order.total_price || 0).toFixed(2).replace('.', ',')
        const status = order.is_paid ? 'Bezahlt' : 'Offen'

        const items = order.order_items.map((item) => {
          const product = Array.isArray(item.products)
            ? item.products[0]
            : (item.products as { name_de?: string } | null)
          return `${item.quantity}x ${product?.name_de || 'Unbekannt'}`
        }).join('; ')

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
      link.download = `Bestellungen_${weekKey}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
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
              {data.map((month: RevenueMonthWeekSummary) => (
                <div key={month.key}>
                  <div className="flex items-center justify-between gap-3 bg-muted/30 px-5 py-3">
                    <div>
                      <span className="font-semibold text-sm">{monthLabel(month.key)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{month.orderCount} Bestellung{month.orderCount !== 1 ? 'en' : ''}</span>
                    </div>
                    <span className="font-bold text-sm tabular-nums text-green-600">{formatEur(month.total)}</span>
                  </div>
                  {month.weeks.map((week) => (
                    <div key={week.key} className="flex flex-wrap items-center justify-between gap-3 border-t px-8 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{weekLabel(week.key)}</span>
                          <span className="text-xs text-muted-foreground">{week.startDate} - {week.endDate}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{week.orderCount} Bestellung{week.orderCount !== 1 ? 'en' : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm tabular-nums text-green-600">{formatEur(week.total)}</span>
                        <button onClick={(e) => handleExportCSV(week.key, e)} disabled={isExporting === week.key} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors disabled:opacity-50" title="KW als CSV herunterladen">
                          {isExporting === week.key ? '...' : 'CSV'}
                        </button>
                      </div>
                    </div>
                  ))}
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
