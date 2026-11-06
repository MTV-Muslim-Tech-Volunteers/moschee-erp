import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieGet = vi.fn()
const queryResult = vi.fn()

vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ select: () => ({ order: queryResult }) }) }),
}))

import { POST } from "./route"

const request = (body: unknown) => new Request("http://localhost/api/finance/revenue-pdf", { method: "POST", body: JSON.stringify(body) })

const order = (name: string, product: string, overrides = {}) => ({
  id: name,
  created_at: "2026-10-12T12:00:00.000Z",
  customer_name: name,
  total_price: 10,
  is_paid: true,
  is_cancelled: false,
  order_items: [{ id: "i", quantity: 2, price_at_time: 5, products: { name_de: product } }],
  ...overrides,
})

describe("POST /api/finance/revenue-pdf", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://supabase.test")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon")
    cookieGet.mockReturnValue({ value: "role_finance" })
    queryResult.mockResolvedValue({ data: [order("Ali", "Tee")], error: null })
  })

  it("rejects users without the finance role", async () => {
    cookieGet.mockReturnValue({ value: "role_admin" })
    expect((await POST(request({}))).status).toBe(403)
  })

  it("rejects an invalid week key", async () => {
    expect((await POST(request({ weekKey: "2026-10" }))).status).toBe(400)
  })

  it("returns 404 without orders", async () => {
    queryResult.mockResolvedValue({ data: [], error: null })
    expect((await POST(request({}))).status).toBe(404)
  })

  it("creates a PDF for one week", async () => {
    const response = await POST(request({ weekKey: "2026-W42" }))
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toContain("Einnahmen_2026-W42.pdf")
    expect(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-")
  })

  it("creates a PDF for names with emoji, Arabic text, Turkish letters and newlines", async () => {
    queryResult.mockResolvedValue({
      data: [
        order("Ali 😀\nمرحبا", "Çay Işıl ő"),
        order("Ayşe Yılmaz", "Sehr langer Produktname ".repeat(30)),
        order("x".repeat(300), "Tee", { is_paid: false }),
      ],
      error: null,
    })
    const response = await POST(request({}))
    expect(response.status).toBe(200)
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000)
  })

  it("creates a multi-page PDF for many orders", async () => {
    queryResult.mockResolvedValue({ data: Array.from({ length: 200 }, (_, index) => order(`Kunde ${index}`, "Tee")), error: null })
    expect((await POST(request({}))).status).toBe(200)
  })
})
