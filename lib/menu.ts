export interface Product {
  id: string
  name_de: string
  name_tr: string
  description_de: string
  description_tr: string
  price: number
  image_url: string | null
  is_available: boolean
  category: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface TrackedOrder {
  id: string
  created_at: string
  is_ready: boolean
  is_cancelled: boolean
}

export type Language = "de" | "tr"

export function groupByCategory(products: Product[]): Record<string, Product[]> {
  return products.reduce<Record<string, Product[]>>((acc, product) => {
    const key = product.category ?? "Sonstiges"
    if (!acc[key]) acc[key] = []
    acc[key].push(product)
    return acc
  }, {})
}
