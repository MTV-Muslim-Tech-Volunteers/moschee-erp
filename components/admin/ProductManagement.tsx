"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/menu"
import { deleteProduct, updateProduct, updateProductAvailability } from "@/app/products/actions"
import { filterProducts, getProductCategories } from "@/lib/admin-products"

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Alle")

  const categories = useMemo(() => getProductCategories(products), [products])
  const filteredProducts = useMemo(() => filterProducts(products, query, category), [category, products, query])
  const availableCount = products.filter((product) => product.is_available).length

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase.from("products").select("*").order("category").order("name_de")
      setProducts(data ?? [])
      setLoading(false)
    }

    void loadProducts()
  }, [])

  function updateLocalProduct(updated: Product) {
    setProducts((current) => current.map((product) => product.id === updated.id ? updated : product))
  }

  return (
    <section className="rounded-2xl border border-[#2c241d] bg-[#181411] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="border-b border-[#2c241d] pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9a36c]">Sortiment</p>
        <h2 className="mt-1 text-xl font-semibold text-stone-100">Produkte ändern</h2>
        <p className="mt-1 text-sm text-stone-400">Preise anpassen, Produkte vorübergehend ausblenden oder dauerhaft löschen.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-300">{availableCount} sichtbar</span>
          <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-red-300">{products.length - availableCount} ausgeblendet</span>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-stone-400">{products.length} insgesamt</span>
        </div>
      </div>

      {!loading && products.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Produkte suchen</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Produkt suchen..." className="h-11 w-full rounded-xl border border-[#3a2d22] bg-[#0f0d0b] px-4 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-[#d9a36c]" />
          </label>
          <label>
            <span className="sr-only">Kategorie filtern</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-xl border border-[#3a2d22] bg-[#0f0d0b] px-4 text-sm text-stone-100 outline-none focus:border-[#d9a36c] sm:w-48">
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-stone-400">Produkte werden geladen...</p>}
        {!loading && products.length === 0 && <p className="text-sm text-stone-400">Noch keine Produkte vorhanden.</p>}
        {!loading && products.length > 0 && filteredProducts.length === 0 && <p className="rounded-xl border border-dashed border-[#3a2d22] px-4 py-8 text-center text-sm text-stone-400">Keine passenden Produkte gefunden.</p>}
        {filteredProducts.map((product) => (
          <ManagedProductRow
            key={product.id}
            product={product}
            onChange={updateLocalProduct}
            onDelete={() => setProducts((current) => current.filter((item) => item.id !== product.id))}
          />
        ))}
      </div>
    </section>
  )
}

function ManagedProductRow({ product, onChange, onDelete }: { product: Product; onChange: (product: Product) => void; onDelete: () => void }) {
  const [price, setPrice] = useState(product.price.toFixed(2))
  const [busy, setBusy] = useState(false)

  async function savePrice() {
    const nextPrice = Number(price)
    if (!Number.isFinite(nextPrice) || nextPrice < 0) return
    setBusy(true)
    const result = await updateProduct(product.id, { price: nextPrice })
    if (result.success) onChange({ ...product, price: nextPrice })
    setBusy(false)
  }

  async function toggleAvailability() {
    setBusy(true)
    const result = await updateProductAvailability(product.id, !product.is_available)
    if (result.success) onChange({ ...product, is_available: !product.is_available })
    setBusy(false)
  }

  async function removeProduct() {
    if (!window.confirm(`${product.name_de} dauerhaft löschen?`)) return
    setBusy(true)
    const result = await deleteProduct(product.id)
    if (result.success) onDelete()
    setBusy(false)
  }

  return (
    <div className={`flex flex-col gap-3 rounded-xl border border-[#2c241d] p-4 sm:flex-row sm:items-center sm:justify-between ${product.is_available ? "bg-[#14110e]" : "bg-red-950/20 opacity-70"}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-stone-100">{product.name_de}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${product.is_available ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{product.is_available ? "Sichtbar" : "Ausgeblendet"}</span>
        </div>
        <p className="text-xs text-stone-400">{product.category} · {product.price.toFixed(2).replace(".", ",")} €</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`price-${product.id}`}>Preis für {product.name_de}</label>
        <input id={`price-${product.id}`} type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="h-9 w-24 rounded-lg border border-[#3a2d22] bg-[#0f0d0b] px-2 text-sm text-stone-100" />
        <button type="button" onClick={savePrice} disabled={busy} className="h-9 rounded-lg border border-[#5a4635] px-3 text-sm text-stone-200 transition-colors hover:bg-[#2a2019] disabled:opacity-50">Preis speichern</button>
        <button type="button" onClick={toggleAvailability} disabled={busy} className="h-9 rounded-lg border border-[#5a4635] px-3 text-sm text-stone-200 transition-colors hover:bg-[#2a2019] disabled:opacity-50">{product.is_available ? "Ausblenden" : "Einblenden"}</button>
        <button type="button" onClick={removeProduct} disabled={busy} className="h-9 rounded-lg border border-red-500/60 px-3 text-sm text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50">Löschen</button>
      </div>
    </div>
  )
}