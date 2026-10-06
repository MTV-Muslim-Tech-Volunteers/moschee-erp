"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { groupByCategory, type Product } from '@/lib/menu'
import QuickOrderProductGrid from '@/components/kitchen/QuickOrderProductGrid'
import QuickOrderSidebar from '@/components/kitchen/QuickOrderSidebar'

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
        const next = { ...current }
        delete next[productId]
        return next
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

              <QuickOrderProductGrid groupedProducts={groupedProducts} selectedItems={selectedItems} loading={loading} onAdjustQuantity={adjustQuantity} />
            </div>
            <QuickOrderSidebar selectedList={selectedList} total={total} submitting={submitting} onSubmit={submitOrder} />
          </div>
        </section>
      </div>
    </main>
  )
}