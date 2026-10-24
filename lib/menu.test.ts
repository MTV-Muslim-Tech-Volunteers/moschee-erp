import { describe, expect, it } from "vitest"
import { getVisibleProducts, groupByCategory, translateCategory, type Product } from "./menu"

const product = (overrides: Partial<Product>): Product => ({
  id: "id",
  name_de: "Produkt",
  name_tr: "Ürün",
  description_de: "Beschreibung",
  description_tr: "Açıklama",
  price: 2.5,
  image_url: null,
  is_available: true,
  category: "Hauptspeise",
  ...overrides,
})

describe("menu product visibility", () => {
  it("excludes temporarily unavailable products", () => {
    const visible = getVisibleProducts([
      product({ id: "active" }),
      product({ id: "inactive", is_available: false }),
    ])

    expect(visible.map((item) => item.id)).toEqual(["active"])
  })
})

describe("menu translations", () => {
  it("translates known categories to Turkish", () => {
    expect(translateCategory("Hauptspeise", "tr")).toBe("Ana yemek")
    expect(translateCategory("Getränk", "tr")).toBe("İçecek")
    expect(translateCategory("Merch", "tr")).toBe("Ürünler")
  })
})

describe("menu category grouping", () => {
  it("puts Merch after all food and drink categories", () => {
    const grouped = groupByCategory([
      product({ id: "merch", category: "Merch" }),
      product({ id: "drink", category: "Getränk" }),
      product({ id: "main", category: "Hauptspeise" }),
    ])

    expect(Object.keys(grouped)).toEqual(["Getränk", "Hauptspeise", "Merch"])
  })

  it("keeps toast products together without changing their category position", () => {
    const grouped = groupByCategory([
      product({ id: "other", name_de: "Salat" }),
      product({ id: "toast-two", name_de: "Toast mit Käse" }),
      product({ id: "toast-one", name_de: "Toast" }),
    ])

    expect(grouped.Hauptspeise.map((item) => item.id)).toEqual(["other", "toast-two", "toast-one"])
  })
})