import { describe, expect, it } from "vitest"
import { buildRevenueData, buildRevenueMonthWeekData, buildRevenueWeekData, filterKitchenOrders, formatEur, formatOrderTimestamp, formatWeekDateRange, getEscalationSummary, getISOWeek, summarizeActiveItems, type KitchenOrder, type RevenueOrder } from "./kitchen"

const order = (overrides: Partial<RevenueOrder>): RevenueOrder => ({
  id: "order",
  created_at: "2026-10-12T12:00:00.000Z",
  total_price: 10,
  is_paid: true,
  order_items: [],
  ...overrides,
})

const kitchenOrder = (overrides: Partial<KitchenOrder>): KitchenOrder => ({
  id: "order",
  created_at: "2026-10-24T12:00:00.000Z",
  customer_name: "Kunde",
  total_price: 10,
  is_paid: false,
  is_ready: false,
  order_items: [],
  ...overrides,
})

describe("kitchen revenue", () => {
  it("ignores unpaid and incomplete orders", () => {
    const result = buildRevenueData([
      order({ id: "paid" }),
      order({ id: "unpaid", is_paid: false }),
      order({ id: "missing-total", total_price: null }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(10)
    expect(result[0].orderCount).toBe(1)
  })

  it("groups paid orders by month and ISO week", () => {
    const result = buildRevenueData([
      order({ id: "one", total_price: 10, created_at: "2026-10-12T12:00:00.000Z" }),
      order({ id: "two", total_price: 7.5, created_at: "2026-10-13T12:00:00.000Z" }),
    ])

    expect(result[0]).toMatchObject({ key: "2026-10", total: 17.5, orderCount: 2 })
    expect(result[0].weeks).toEqual([{ key: "2026-W42", total: 17.5, orderCount: 2 }])
  })

  it("formats euro values and ISO week boundaries", () => {
    expect(formatEur(12.5)).toBe("12,50 €")
    expect(getISOWeek(new Date("2026-01-01T00:00:00.000Z"))).toBe(1)
  })

  it("builds weekly summaries with a Monday-to-Sunday range", () => {
    const result = buildRevenueWeekData([
      order({ created_at: "2026-10-12T12:00:00.000Z", total_price: 10 }),
      order({ created_at: "2026-10-18T12:00:00.000Z", total_price: 7.5 }),
    ])

    expect(result[0]).toMatchObject({ key: "2026-W42", total: 17.5, orderCount: 2 })
    expect(formatWeekDateRange("2026-W42")).toBe("12.10.26 - 18.10.26")
  })

  it("groups weeks under calendar months", () => {
    const result = buildRevenueMonthWeekData([
      order({ created_at: "2026-10-12T12:00:00.000Z", total_price: 10 }),
      order({ created_at: "2026-10-20T12:00:00.000Z", total_price: 7.5 }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ key: "2026-10", total: 17.5, orderCount: 2 })
    expect(result[0].weeks.map((week) => week.key)).toEqual(["2026-W43", "2026-W42"])
  })

  it("shows only the time for recent orders and date plus time after 24 hours", () => {
    const now = new Date("2026-10-24T12:00:00.000Z").getTime()
    const recent = new Date("2026-10-24T11:00:00.000Z")
    expect(formatOrderTimestamp(recent.toISOString(), now)).toBe(recent.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }))
    expect(formatOrderTimestamp("2026-10-22T08:15:00.000Z", now)).toMatch(/^22\/10\/26 \d{2}:\d{2}$/)
  })
})

describe("kitchen order summaries", () => {
  it("filters active, completed and all orders", () => {
    const active = kitchenOrder({ id: "active" })
    const completed = kitchenOrder({ id: "completed", is_ready: true })
    const orders = [active, completed]

    expect(filterKitchenOrders(orders, "active").map((item) => item.id)).toEqual(["active"])
    expect(filterKitchenOrders(orders, "completed").map((item) => item.id)).toEqual(["completed"])
    expect(filterKitchenOrders(orders, "all")).toEqual(orders)
  })

  it("summarizes only active items by quantity", () => {
    const orders = [
      kitchenOrder({ order_items: [{ id: "one", quantity: 2, price_at_time: 3, products: { id: "p", name_de: "Pommes", is_available: true } }] }),
      kitchenOrder({ id: "two", order_items: [{ id: "two", quantity: 1, price_at_time: 3, products: { id: "p", name_de: "Pommes", is_available: true } }] }),
      kitchenOrder({ id: "done", is_ready: true, order_items: [{ id: "three", quantity: 9, price_at_time: 3, products: { id: "p", name_de: "Pommes", is_available: true } }] }),
    ]

    expect(summarizeActiveItems(orders)).toEqual([["Pommes", 3]])
  })

  it("marks delayed and unavailable active orders as escalations", () => {
    const now = new Date("2026-10-24T12:00:00.000Z").getTime()
    const summary = getEscalationSummary([
      kitchenOrder({ id: "yellow", created_at: "2026-10-24T11:40:00.000Z" }),
      kitchenOrder({ id: "red", created_at: "2026-10-24T11:00:00.000Z" }),
      kitchenOrder({ id: "unavailable", order_items: [{ id: "item", quantity: 1, price_at_time: 1, products: { id: "p", name_de: "Produkt", is_available: false } }] }),
    ], now)

    expect(summary).toMatchObject({ yellowCount: 1, redCount: 2, totalCount: 3, worstLabel: "Überfällig" })
  })
})