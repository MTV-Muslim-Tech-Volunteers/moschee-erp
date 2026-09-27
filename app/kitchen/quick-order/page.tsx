"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { groupByCategory, type Product } from '@/lib/menu'

type SelectedItems = Record<string, number>

export default function QuickOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState('Kunde')
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({})

  useEffect(() => {
    async function fetchProducts() {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, name_de, name_tr, description_de, description_tr, price, is_available, category')
        .order('category')
        .order('name_de')

      if (fetchError) {
        setError('Produkte konnten nicht geladen werden.')
      } else {
        setProducts((data ?? []) as Product[])
      }

      setLoading(false)
    }

    fetchProducts()
  }, [])

  const groupedProducts = useMemo(() => groupByCategory(products), [products])

  const selectedList = useMemo(
    () =>
      products
        .filter((product) => (selectedItems[product.id] ?? 0) > 0)
        .map((product) => ({ product, quantity: selectedItems[product.id] })),
    [products, selectedItems]
  )

  const total = useMemo(
    () => selectedList.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [selectedList]
  )

  const adjustQuantity = (productId: string, delta: number) => {
    setSelectedItems((current) => {
      const nextQuantity = (current[productId] ?? 0) + delta

      if (nextQuantity <= 0) {
        const { [productId]: _removed, ...rest } = current
        return rest
      }

      return { ...current, [productId]: nextQuantity }
    })
  }

  const submitOrder = async () => {
    const normalizedName = customerName.trim() || 'Kunde'

    if (selectedList.length === 0) {
      setError('Bitte mindestens ein Produkt auswählen.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: normalizedName,
          total_price: total,
          is_paid: false,
          is_ready: false,
        })
        .select('id')
        .single()

      if (orderError || !orderData) {
        throw new Error(orderError?.message || 'Bestellung konnte nicht angelegt werden.')
      }

      const orderItems = selectedList.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.price,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) {
        throw new Error(itemsError.message)
      }

      router.push('/kitchen?quickOrder=success')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Bestellung konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] px-4 py-4 text-stone-100 lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-6 lg:flex-row">
        <section className="min-w-0 flex-1 space-y-6 rounded-3xl border border-[#2c241d] bg-[#15110e]/92 p-5 shadow-sm shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2c241d] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">Küchenansicht</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Quick Order</h1>
              <p className="mt-1 text-sm text-stone-400">Schnelle Bestellung ohne Umweg über den Menüscreen.</p>
            </div>
            <Link
              href="/kitchen"
              className="inline-flex items-center gap-2 rounded-xl border border-[#31271f] bg-[#1a1512] px-3 py-2 text-sm font-medium transition-colors hover:bg-[#231b16]"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Küche
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4 rounded-2xl border border-[#2c241d] bg-[#181411] p-4">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Kundenname</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-xl border border-[#31271f] bg-[#120f0d] px-4 py-3 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-500 focus:border-[#d9a36c]"
                  placeholder="Kunde"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-28 rounded-2xl border border-[#2f261f] bg-[#1b1612]" />
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.keys(groupedProducts).length === 0 ? (
                    <div className="rounded-2xl border border-[#2f261f] bg-[#1b1612] px-4 py-8 text-center text-sm text-stone-400">
                      Keine Produkte gefunden.
                    </div>
                  ) : (
                    Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                      <section key={category} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-[#2c241d] pb-2">
                          <h2 className="text-sm font-semibold tracking-wide text-stone-100">{category}</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {categoryProducts.map((product) => {
                            const quantity = selectedItems[product.id] ?? 0

                            return (
                              <article
                                key={product.id}
                                className={`rounded-2xl border p-4 transition-colors ${product.is_available ? 'border-[#2f261f] bg-[#1b1612]' : 'border-[#3a241f] bg-[#221813] opacity-70'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-stone-100">{product.name_de}</h3>
                                    <p className="mt-1 text-xs text-stone-400">{product.category}</p>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-[#2b221c] px-2.5 py-1 text-xs font-semibold text-stone-100">
                                    {product.price.toFixed(2).replace('.', ',')} €
                                  </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1 text-xs text-stone-400">
                                    {product.is_available ? 'Verfügbar' : 'Nicht verfügbar'}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => adjustQuantity(product.id, -1)}
                                      disabled={quantity === 0}
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#31271f] bg-[#120f0d] font-semibold text-stone-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="w-6 shrink-0 text-center text-sm font-semibold text-stone-100">{quantity}</div>
                                    <button
                                      type="button"
                                      onClick={() => adjustQuantity(product.id, 1)}
                                      disabled={!product.is_available}
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#5a4228] bg-[#d9a36c] font-semibold text-[#24160e] transition-colors hover:bg-[#e4b37d] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      </section>
                    ))
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-4 rounded-2xl border border-[#2c241d] bg-[#181411] p-4 lg:sticky lg:top-6 lg:self-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">Zusammenfassung</p>
                <h2 className="mt-1 text-lg font-semibold text-stone-100">Aktuelle Bestellung</h2>
              </div>

              <div className="space-y-3">
                {selectedList.length === 0 ? (
                  <div className="rounded-2xl border border-[#2f261f] bg-[#1b1612] px-4 py-6 text-sm text-stone-400">
                    Noch keine Produkte ausgewählt.
                  </div>
                ) : (
                  selectedList.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#2f261f] bg-[#1b1612] px-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-100">{product.name_de}</p>
                        <p className="text-xs text-stone-400">{quantity} x {product.price.toFixed(2).replace('.', ',')} €</p>
                      </div>
                      <p className="shrink-0 font-semibold text-stone-100">{(product.price * quantity).toFixed(2).replace('.', ',')} €</p>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-2xl border border-[#2f261f] bg-[#1b1612] px-4 py-4">
                <div className="flex items-center justify-between text-sm text-stone-400">
                  <span>Gesamt</span>
                  <span className="text-lg font-bold text-stone-100">{total.toFixed(2).replace('.', ',')} €</span>
                </div>
              </div>

              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting || selectedList.length === 0}
                className="w-full rounded-xl bg-[#d9a36c] px-4 py-3 text-sm font-semibold text-[#24160e] transition-colors hover:bg-[#e4b37d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Speichere...' : 'Bestellung anlegen'}
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}