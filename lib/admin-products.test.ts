import { describe, expect, it } from "vitest"
import { canAccessProductChanges, filterProducts, getProductCategories } from "./admin-products"
import type { Product } from "./menu"

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

describe("product change access", () => {
  it("allows only finance users", () => {
    expect(canAccessProductChanges("role_finance")).toBe(true)
    expect(canAccessProductChanges("role_admin")).toBe(false)
    expect(canAccessProductChanges(undefined)).toBe(false)
  })
})

describe("product management filters", () => {
  it("returns unique categories with the all option", () => {
    expect(getProductCategories([
      product({ category: "Merch" }),
      product({ id: "drink", category: "Getränk" }),
      product({ id: "drink-2", category: "Getränk" }),
    ])).toEqual(["Alle", "Merch", "Getränk"])
  })

  it("filters by German or Turkish name and category", () => {
    const products = [
      product({ id: "fries", name_de: "Pommes", name_tr: "Patates" }),
      product({ id: "shirt", name_de: "T-Shirt", name_tr: "Tişört", category: "Merch" }),
    ]

    expect(filterProducts(products, "patates", "Alle").map((item) => item.id)).toEqual(["fries"])
    expect(filterProducts(products, "", "Merch").map((item) => item.id)).toEqual(["shirt"])
  })
})