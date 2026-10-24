"use client"

import { useEffect, useState, useCallback, useSyncExternalStore } from "react"
import { supabase } from "@/lib/supabase"
import ProductSkeleton from "@/components/menu/ProductSkeleton"
import CartDrawer from "@/components/menu/CartDrawer"
import MenuHeader from "@/components/menu/MenuHeader"
import TrackedOrdersPanel from "@/components/menu/TrackedOrdersPanel"
import MenuProductSections from "@/components/menu/MenuProductSections"
import { Product, CartItem, TrackedOrder, Language, getVisibleProducts, groupByCategory } from "@/lib/menu"

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<Language>("de")
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([])
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false)

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("category")
      .order("name_de")

    if (error) {
      setError("Fehler beim Laden.")
    } else {
      setError(null)
      setProducts(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => { void fetchProducts() })
    const channel = supabase
      .channel("menu-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void fetchProducts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchProducts])

  useEffect(() => {
    const savedCart = localStorage.getItem("my_cart")
    const savedOrders = localStorage.getItem("my_tracked_orders")

    queueMicrotask(() => {
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)) } catch (e) { console.error(e) }
      }
      if (savedOrders) {
        try { setTrackedOrders(JSON.parse(savedOrders)) } catch (e) { console.error(e) }
      }
    })
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("my_cart", JSON.stringify(cart))
    }
  }, [cart, isClient])

  useEffect(() => {
    if (trackedOrders.length === 0) return
    const channel = supabase
      .channel("my-orders-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
          setTrackedOrders((prev) => {
            const updated = prev.map((order) => {
              if (payload.eventType === "UPDATE" && payload.new && order.id === payload.new.id) {
                return { ...order, is_ready: payload.new.is_ready }
              }
              if (payload.eventType === "DELETE" && payload.old && order.id === payload.old.id) {
                return { ...order, is_cancelled: true }
              }
              return order
            })
            localStorage.setItem("my_tracked_orders", JSON.stringify(updated))
            return updated
          })
        }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [trackedOrders.length])

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0))
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const placeOrder = useCallback(
    async (customerName: string) => {
      const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({ customer_name: customerName, total_price: total })
        .select()
        .single()

      if (orderError || !orderData) throw new Error(orderError?.message)

      const items = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(items)
      if (itemsError) throw new Error(itemsError.message)

      const newTrackedOrder: TrackedOrder = {
        id: orderData.id,
        created_at: new Date().toISOString(),
        is_ready: false,
        is_cancelled: false
      }
      
      setTrackedOrders(prev => {
        const updated = [newTrackedOrder, ...prev]
        localStorage.setItem("my_tracked_orders", JSON.stringify(updated))
        return updated
      })

      setCart([])
    },
    [cart]
  )

  const clearTrackedOrders = () => {
    setTrackedOrders([])
    localStorage.removeItem("my_tracked_orders")
  }

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const grouped = groupByCategory(getVisibleProducts(products))
  const categories = Object.keys(grouped)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] py-10 px-4 pb-24 text-stone-100">
      <div className="max-w-5xl mx-auto space-y-10">

        <MenuHeader lang={lang} onLanguageChange={setLang} />

        {isClient && trackedOrders.length > 0 && (
          <TrackedOrdersPanel orders={trackedOrders} lang={lang} onClear={clearTrackedOrders} />
        )}

        {error && <div className="text-red-500 text-center">{lang === "de" ? error : "Yükleme sırasında bir hata oluştu."}</div>}

        {loading && (
           <div className="grid grid-cols-2 gap-4">
             {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
           </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="rounded-2xl border border-[#3a2d22] bg-[#181411] px-6 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-semibold">{lang === "de" ? "Zurzeit kein Verkauf" : "Şu anda satış yok"}</h2>
            <p className="mt-2 text-sm text-stone-400">{lang === "de" ? "Bitte schauen Sie später wieder vorbei." : "Lütfen daha sonra tekrar bakın."}</p>
          </div>
        )}

        {!loading && !error && <MenuProductSections grouped={grouped} lang={lang} cart={cart} onAdd={addToCart} />}
      </div>

      {isClient && totalCartItems > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-2xl border border-[#d9a36c] px-5 py-3.5 bg-[#d9a36c] text-[#24160e] shadow-[0_6px_16px_rgba(120,80,40,0.24)] font-semibold text-sm transition-all hover:bg-[#e4b37d] hover:-translate-y-0.5">
          <span>{lang === "de" ? "Warenkorb" : "Sepet"}</span>
          <span className="bg-slate-900 text-white rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center">{totalCartItems}</span>
        </button>
      )}

      {isClient && (
        <CartDrawer
          cart={cart}
          lang={lang}
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onOrder={placeOrder}
        />
      )}
    </main>
  )
}