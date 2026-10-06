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
  const grouped = products.reduce<Record<string, Product[]>>((acc, product) => {
    const key = product.category ?? "Sonstiges"
    if (!acc[key]) acc[key] = []
    acc[key].push(product)
    return acc
  }, {})

  return Object.fromEntries(
    Object.entries(grouped).map(([category, categoryProducts]) => {
      const firstToastIndex = categoryProducts.findIndex((product) =>
        product.name_de.toLocaleLowerCase().includes("toast")
      )
      if (firstToastIndex === -1) return [category, categoryProducts]

      const isToast = (product: Product) => product.name_de.toLocaleLowerCase().includes("toast")
      return [category, [
        ...categoryProducts.slice(0, firstToastIndex).filter((product) => !isToast(product)),
        ...categoryProducts.filter(isToast),
        ...categoryProducts.slice(firstToastIndex + 1).filter((product) => !isToast(product)),
      ]]
    })
  )
}
