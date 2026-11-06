import React, { useState, useMemo } from 'react'
import { useEffect } from 'react'
import { buildRevenueMonthWeekData, formatBerlinDate, formatBerlinTime, formatEur, monthLabel, weekLabel, type RevenueMonthWeekSummary, type RevenueOrder } from '@/lib/kitchen'
import type { Language } from '@/lib/menu'

export default function RevenuePanel({ orders }: { orders: RevenueOrder[] }) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf')
  const [language, setLanguage] = useState<Language>('de')
  const [error, setError] = useState<string | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      const savedFormat = localStorage.getItem('revenue_export_format')
      const savedLanguage = localStorage.getItem('revenue_language')
      if (savedFormat === 'pdf' || savedFormat === 'csv') setFormat(savedFormat)
      if (savedLanguage === 'de' || savedLanguage === 'tr') setLanguage(savedLanguage)
      setSettingsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (settingsLoaded) localStorage.setItem('revenue_export_format', format)
  }, [format, settingsLoaded])

  useEffect(() => {
    if (settingsLoaded) localStorage.setItem('revenue_language', language)
  }, [language, settingsLoaded])

  const data = useMemo(() => buildRevenueMonthWeekData(orders), [orders])
  const totalAll = useMemo(() => data.reduce((sum, month) => sum + month.total, 0), [data])

  const labels = language === 'de'
    ? { revenue: 'Einnahmen', total: 'Gesamt', close: 'Zuklappen', open: 'Aufklappen', empty: 'Keine bezahlten Bestellungen vorhanden.', all: 'Alle Wochen herunterladen', week: 'Herunterladen', error: 'Export fehlgeschlagen.', paid: 'Bezahlt', openStatus: 'Offen', cancelled: 'Storniert', unknown: 'Unbekannt' }
    : { revenue: 'Gelirler', total: 'Toplam', close: 'Kapat', open: 'Aç', empty: 'Ödenmiş sipariş bulunamadı.', all: 'Tüm haftaları indir', week: 'İndir', error: 'Dışa aktarma başarısız.', paid: 'Ödendi', openStatus: 'Açık', cancelled: 'İptal edildi', unknown: 'Bilinmiyor' }

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const exportReport = async (weekKey?: string) => {
    const exportId = weekKey ?? 'all'
    setIsExporting(exportId)
    setError(null)
    try {
      if (format === 'pdf') {
        const response = await fetch('/api/finance/revenue-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(weekKey ? { weekKey } : {}),
        })
        if (!response.ok) {
          const result: unknown = await response.json()
          const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string' ? result.error : labels.error
          throw new Error(message)
        }
        const blob = await response.blob()
        const disposition = response.headers.get('Content-Disposition') ?? ''
        const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? (weekKey ? `Einnahmen_${weekKey}.pdf` : 'Einnahmen_Gesamt.pdf')
        triggerDownload(blob, filename)
      } else {
        const weekOrders = orders.filter((order) => !weekKey || weekOf(order.created_at) === weekKey)
        const headers = weekKey
          ? ['Datum', 'Uhrzeit', 'Kunde', 'Summe (€)', 'Status', 'Artikel']
          : ['KW', 'Datum', 'Uhrzeit', 'Kunde', 'Summe (€)', 'Status', 'Artikel']
        const rows = weekOrders.map((order) => {
          const items = order.order_items.map((item) => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products
            return `${item.quantity}x ${product?.name_de || labels.unknown}`
          }).join('; ')
          const fields = [formatBerlinDate(order.created_at), formatBerlinTime(order.created_at), order.customer_name || labels.unknown, (order.total_price ?? 0).toFixed(2).replace('.', ','), order.is_cancelled ? labels.cancelled : order.is_paid ? labels.paid : labels.openStatus, items]
          return (weekKey ? fields : [weekOf(order.created_at), ...fields]).map((value) => `"${value.replace(/"/g, '""')}"`).join(',')
        })
        const content = '\uFEFF' + [headers.join(','), ...rows].join('\n')
        const filename = weekKey ? `Bestellungen_${weekKey}.csv` : 'Einnahmen_Gesamt.csv'
        triggerDownload(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename)
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : labels.error)
    } finally {
      setIsExporting(null)
    }
  }

  const weekOf = (iso: string) => {
    const date = new Date(iso)
    const berlinDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
    const parts = Object.fromEntries(berlinDate.map((part) => [part.type, part.value]))
    const utcDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
    const day = utcDate.getUTCDay() || 7
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
    const year = utcDate.getUTCFullYear()
    const week = Math.ceil(((utcDate.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
    return `${year}-W${String(week).padStart(2, '0')}`
  }

  return (
    <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full min-h-12 flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold">{labels.revenue}</span>
          <span className="text-sm text-muted-foreground font-normal">{labels.total}: {formatEur(totalAll)}</span>
        </div>
        <span className="text-muted-foreground text-sm">{open ? labels.close : labels.open}</span>
      </button>

      {open && (
        <div className="border-t">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <div className="inline-flex min-h-11 items-center rounded-lg border p-1" role="group" aria-label="Exportformat">
              {(['pdf', 'csv'] as const).map((value) => <button key={value} onClick={() => setFormat(value)} className={`min-h-9 rounded-md px-4 text-sm font-semibold uppercase ${format === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{value}</button>)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex min-h-11 items-center rounded-lg border p-1" role="group" aria-label="Sprache">
                {(['de', 'tr'] as Language[]).map((value) => <button key={value} onClick={() => setLanguage(value)} className={`min-h-9 rounded-md px-3 text-sm font-semibold ${language === value ? 'bg-muted' : 'text-muted-foreground'}`}>{value.toUpperCase()}</button>)}
              </div>
              <button onClick={() => void exportReport()} disabled={isExporting !== null} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{isExporting === 'all' ? '...' : labels.all}</button>
            </div>
          </div>
          {error && <p role="alert" className="px-5 py-3 text-sm text-destructive">{error}</p>}
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-4">{labels.empty}</p>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm tabular-nums text-green-600">{formatEur(week.total)}</span>
                        <button onClick={() => void exportReport(week.key)} disabled={isExporting !== null} className="min-h-11 rounded-lg bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50">
                          {isExporting === week.key ? '...' : `${labels.week} ${format.toUpperCase()}`}
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
