import type { Product } from "./menu"

export function canAccessProductChanges(role: string | undefined): boolean {
  return role === "role_finance"
}

export function getProductCategories(products: Product[]): string[] {
  return ["Alle", ...new Set(products.map((product) => product.category))]
}

export function filterProducts(products: Product[], query: string, category: string): Product[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return products.filter((product) => {
    const matchesCategory = category === "Alle" || product.category === category
    const matchesQuery = !normalizedQuery ||
      product.name_de.toLocaleLowerCase().includes(normalizedQuery) ||
      product.name_tr.toLocaleLowerCase().includes(normalizedQuery)

    return matchesCategory && matchesQuery
  })
}