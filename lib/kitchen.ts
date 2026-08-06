export interface Product {
  id: string
  name_de: string
  name_tr?: string
  is_available: boolean
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function timeSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'gerade eben'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  return `${Math.floor(diff / 3600)}h`
}

export function formatEur(value: number): string {
  return value.toFixed(2).replace('.', ',') + ' €'
}

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function weekKey(date: Date): string {
  return `${date.getFullYear()}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

export const MONTH_NAMES = [
  'Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'
]

export function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
}

export function weekLabel(key: string): string {
  const [, week] = key.split('-W')
  return `KW ${parseInt(week)}`
}

export function buildRevenueData(orders: any[]) {
  const paid = orders.filter((o) => o.is_paid && o.total_price != null)
  const monthMap = new Map<string, Map<string, { total: number; count: number }>>()

  for (const order of paid) {
    const date = new Date(order.created_at)
    const mk = monthKey(date)
    const wk = weekKey(date)

    if (!monthMap.has(mk)) monthMap.set(mk, new Map())
    const wMap = monthMap.get(mk)!
    if (!wMap.has(wk)) wMap.set(wk, { total: 0, count: 0 })
    const entry = wMap.get(wk)!
    entry.total += order.total_price!
    entry.count += 1
  }

  const months: any[] = []
  for (const [mk, wMap] of monthMap.entries()) {
    const weeks = Array.from(wMap.entries())
      .map(([wk, { total, count }]) => ({ key: wk, total, orderCount: count }))
      .sort((a, b) => b.key.localeCompare(a.key))
    const total = weeks.reduce((s, w) => s + w.total, 0)
    const orderCount = weeks.reduce((s, w) => s + w.orderCount, 0)
    months.push({ key: mk, total, weeks, orderCount })
  }

  return months.sort((a, b) => b.key.localeCompare(a.key))
}
