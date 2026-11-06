export interface Product {
  id: string
  name_de: string
  name_tr?: string
  is_available: boolean
}
export type KitchenFilter = "all" | "active" | "completed"

export interface EscalationSummary {
  yellowCount: number
  redCount: number
  totalCount: number
  worstLabel: "Überfällig" | "wartet"
}

export function filterKitchenOrders(orders: KitchenOrder[], filter: KitchenFilter): KitchenOrder[] {
  if (filter === "active") return orders.filter((order) => !order.is_ready)
  if (filter === "completed") return orders.filter((order) => order.is_ready)
  return orders
}

export function summarizeActiveItems(orders: KitchenOrder[]): [string, number][] {
  const counts: Record<string, number> = {}
  orders.filter((order) => !order.is_ready).forEach((order) => {
    order.order_items.forEach((item) => {
      const name = item.products?.name_de ?? "Unbekanntes Produkt"
      counts[name] = (counts[name] || 0) + item.quantity
    })
  })
  return Object.entries(counts).sort(([, countA], [, countB]) => countB - countA)
}

export function getEscalationSummary(orders: KitchenOrder[], now: number): EscalationSummary {
  let yellowCount = 0
  let redCount = 0

  orders.forEach((order) => {
    if (order.is_ready) return
    const elapsedMinutes = Math.floor((now - new Date(order.created_at).getTime()) / 60000)
    const hasUnavailable = order.order_items.some((item) => item.products && !item.products.is_available)
    if (hasUnavailable || elapsedMinutes >= 30) redCount += 1
    else if (elapsedMinutes >= 15) yellowCount += 1
  })

  return {
    yellowCount,
    redCount,
    totalCount: yellowCount + redCount,
    worstLabel: redCount > 0 ? "Überfällig" : "wartet",
  }
}

export interface OrderItem {
  id: string
  quantity: number
  price_at_time: number
  products: Product | null
}

export interface KitchenOrder {
  id: string
  created_at: string
  customer_name: string | null
  total_price: number | null
  is_paid: boolean
  is_ready: boolean
  order_items: OrderItem[]
}

export interface RevenueOrder {
  id: string
  created_at: string
  customer_name?: string | null
  total_price: number | null
  is_paid: boolean
  is_cancelled?: boolean
  order_items: Array<Pick<OrderItem, 'quantity'> & { products: Pick<Product, 'name_de'> | Pick<Product, 'name_de'>[] | null }>
}

export interface RevenueWeek {
  key: string
  total: number
  orderCount: number
}

export interface RevenueWeekSummary extends RevenueWeek {
  startDate: string
  endDate: string
}

export interface RevenueMonthWeekSummary {
  key: string
  total: number
  orderCount: number
  weeks: RevenueWeekSummary[]
}

export interface RevenueItemSummary {
  name: string
  quantity: number
}

export interface RevenueDaySummary {
  date: string
  orderCount: number
  total: number
}

export interface RevenueWeeklyReport {
  key: string
  orders: RevenueOrder[]
  total: number
  orderCount: number
  average: number
  items: RevenueItemSummary[]
  days: RevenueDaySummary[]
}

export interface RevenueMonth {
  key: string
  total: number
  orderCount: number
  weeks: RevenueWeek[]
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

function berlinDateParts(iso: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) }
}

export function berlinWeekKey(iso: string): string {
  const { year, month, day } = berlinDateParts(iso)
  return weekKey(new Date(Date.UTC(year, month - 1, day)))
}

export function formatBerlinDate(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatBerlinTime(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function parseRevenueItemString(value: string): RevenueItemSummary[] {
  return value.split(';').map((entry) => {
    const match = entry.trim().match(/^(\d+)x\s+(.+)$/)
    return match
      ? { quantity: Number(match[1]), name: match[2].trim() }
      : { quantity: 1, name: entry.trim() }
  }).filter((item) => item.name.length > 0)
}

export function buildRevenueWeeklyReport(orders: RevenueOrder[], key: string): RevenueWeeklyReport {
  const weekOrders = orders
    .filter((order) => berlinWeekKey(order.created_at) === key)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const paidOrders = weekOrders.filter((order) => order.is_paid && !order.is_cancelled)
  const total = paidOrders.reduce((sum, order) => sum + (order.total_price ?? 0), 0)
  const itemCounts = new Map<string, number>()
  const dayCounts = new Map<string, { orderCount: number; total: number }>()

  for (const order of paidOrders) {
    const day = formatBerlinDate(order.created_at)
    const daySummary = dayCounts.get(day) ?? { orderCount: 0, total: 0 }
    daySummary.orderCount += 1
    daySummary.total += order.total_price ?? 0
    dayCounts.set(day, daySummary)

    for (const item of order.order_items) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
      const name = product?.name_de ?? 'Unbekannt'
      itemCounts.set(name, (itemCounts.get(name) ?? 0) + item.quantity)
    }
  }

  const days = Array.from(dayCounts.entries())
    .map(([date, summary]) => ({ date, ...summary }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    key,
    orders: weekOrders,
    total,
    orderCount: paidOrders.length,
    average: paidOrders.length === 0 ? 0 : total / paidOrders.length,
    items: Array.from(itemCounts.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, 'de')),
    days,
  }
}

export function getISOWeekDateRange(key: string): { start: Date; end: Date } {
  const [yearText, weekText] = key.split('-W')
  const year = Number(yearText)
  const week = Number(weekText)
  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const januaryFourthDay = januaryFourth.getUTCDay() || 7
  const monday = new Date(januaryFourth)
  monday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1 + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: monday, end: sunday }
}

export function formatWeekDateRange(key: string): string {
  const { start, end } = getISOWeekDateRange(key)
  const format = (date: Date) => date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' })
  return `${format(start)} - ${format(end)}`
}

export function buildRevenueWeekData(orders: RevenueOrder[]): RevenueWeekSummary[] {
  const weeks = new Map<string, { total: number; orderCount: number }>()
  for (const order of orders.filter((item) => item.is_paid && item.total_price != null)) {
    const key = weekKey(new Date(order.created_at))
    const current = weeks.get(key) ?? { total: 0, orderCount: 0 }
    current.total += order.total_price!
    current.orderCount += 1
    weeks.set(key, current)
  }

  return Array.from(weeks.entries())
    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
    .map(([key, values]) => ({ key, ...values, startDate: formatWeekDateRange(key).split(' - ')[0], endDate: formatWeekDateRange(key).split(' - ')[1] }))
}

export function buildRevenueMonthWeekData(orders: RevenueOrder[]): RevenueMonthWeekSummary[] {
  const months = new Map<string, Map<string, { total: number; orderCount: number }>>()

  for (const order of orders) {
    const { year, month } = berlinDateParts(order.created_at)
    const week = berlinWeekKey(order.created_at)
    const groupingMonth = monthKey(new Date(Date.UTC(year, month - 1, 1)))
    const weeks = months.get(groupingMonth) ?? new Map<string, { total: number; orderCount: number }>()
    const current = weeks.get(week) ?? { total: 0, orderCount: 0 }
    if (order.is_paid && !order.is_cancelled && order.total_price != null) {
      current.total += order.total_price
      current.orderCount += 1
    }
    weeks.set(week, current)
    months.set(groupingMonth, weeks)
  }

  return Array.from(months.entries())
    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
    .map(([key, weeks]) => {
      const summaries = Array.from(weeks.entries())
        .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
        .map(([weekKeyValue, values]) => ({
          key: weekKeyValue,
          ...values,
          startDate: formatWeekDateRange(weekKeyValue).split(' - ')[0],
          endDate: formatWeekDateRange(weekKeyValue).split(' - ')[1],
        }))
      return {
        key,
        total: summaries.reduce((sum, week) => sum + week.total, 0),
        orderCount: summaries.reduce((sum, week) => sum + week.orderCount, 0),
        weeks: summaries,
      }
    })
}

export function formatOrderTimestamp(iso: string, now = Date.now()): string {
  const orderDate = new Date(iso)
  const ageInHours = (now - orderDate.getTime()) / (1000 * 60 * 60)
  if (ageInHours < 24) return orderDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(orderDate.getDate())}/${pad(orderDate.getMonth() + 1)}/${String(orderDate.getFullYear()).slice(-2)} ${pad(orderDate.getHours())}:${pad(orderDate.getMinutes())}`
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

export function buildRevenueData(orders: RevenueOrder[]): RevenueMonth[] {
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

  const months: RevenueMonth[] = []
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
