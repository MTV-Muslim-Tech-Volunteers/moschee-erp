"use client"

"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import ProductSkeleton from "@/components/menu/ProductSkeleton"
import ProductCard from "@/components/menu/ProductCard"
import CartDrawer from "@/components/menu/CartDrawer"
import { Product, CartItem, TrackedOrder, Language, groupByCategory } from "@/lib/menu"

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<Language>("de")
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([])
  const [isClient, setIsClient] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null)
  const orderConfirmationTimeoutRef = useRef<number | null>(null)

  const showOrderConfirmation = useCallback(() => {
    setOrderConfirmation(
      lang === "de"
        ? "Bestellung erfolgreich aufgegeben!"
        : "Siparişiniz başarıyla alındı!"
    )
    if (orderConfirmationTimeoutRef.current) {
      window.clearTimeout(orderConfirmationTimeoutRef.current)
    }
    orderConfirmationTimeoutRef.current = window.setTimeout(() => {
      setOrderConfirmation(null)
      orderConfirmationTimeoutRef.current = null
    }, 5000)
  }, [lang])

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from("products").select("*").order("category").order("name_de")
      if (error) setError("Fehler beim Laden.")
      else setProducts(data ?? [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    setIsClient(true)
    const savedCart = localStorage.getItem("my_cart")
    const savedOrders = localStorage.getItem("my_tracked_orders")
    
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)) } catch (e) { console.error(e) }
    }
    if (savedOrders) {
      try { setTrackedOrders(JSON.parse(savedOrders)) } catch (e) { console.error(e) }
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("my_cart", JSON.stringify(cart))
    }
  }, [cart, isClient])

  useEffect(() => {
    return () => {
      if (orderConfirmationTimeoutRef.current) {
        window.clearTimeout(orderConfirmationTimeoutRef.current)
      }
    }
  }, [])

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
  const grouped = groupByCategory(products)
  const categories = Object.keys(grouped)

  return (
    <main className="min-h-screen bg-muted/40 py-10 px-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-10">

        <div className="flex flex-col items-center gap-4 text-center">
          <Image src="/ditib-gk-logo.png" alt="Logo" width={80} height={80} className="rounded-full" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Speisekarte</h1>
          </div>
          <div className="inline-flex rounded-lg border bg-background p-1 gap-1">
            {(["de", "tr"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {l === "de" ? "Deutsch" : "Türkçe"}
              </button>
            ))}
          </div>
        </div>

        {isClient && trackedOrders.length > 0 && (
          <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 animate-pulse"></div>
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-sm">
                 {lang === "de" ? "Ihre aktiven Bestellungen" : "Aktif Siparişleriniz"}
               </h3>
               <button onClick={clearTrackedOrders} className="text-xs text-muted-foreground hover:underline">
                 {lang === "de" ? "Verlauf löschen" : "Geçmişi temizle"}
               </button>
            </div>
            <div className="space-y-2">
              {trackedOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-muted/50 border">
                  <span className="text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                  </span>
                  <div>
                    {order.is_cancelled ? (
                      <span className="bg-red-500/20 text-red-600 px-2.5 py-1 rounded-full font-semibold text-xs">Storniert</span>
                    ) : order.is_ready ? (
                      <span className="bg-green-500/20 text-green-600 px-2.5 py-1 rounded-full font-semibold text-xs">Abholbereit!</span>
                    ) : (
                      <span className="bg-blue-500/20 text-blue-600 px-2.5 py-1 rounded-full font-semibold text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                        Wird zubereitet...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="text-red-500 text-center">{error}</div>}
        
        {loading && (
           <div className="grid grid-cols-2 gap-4">
             {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
           </div>
        )}

        {!loading && !error && categories.map((category) => (
          <section key={category} className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <h2 className="text-xl font-semibold tracking-tight">{category}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {grouped[category].map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  onAdd={addToCart}
                  cartQty={cart.find((i) => i.product.id === product.id)?.quantity ?? 0}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {isClient && totalCartItems > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-6 right-6 z-30 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl font-semibold text-sm transition-all hover:bg-primary/90">
          <span>{lang === "de" ? "Warenkorb" : "Sepet"}</span>
          <span className="bg-primary-foreground text-primary rounded-full w-6 h-6 text-xs font-bold flex items-center justify-center">{totalCartItems}</span>
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
          onOrderSuccess={showOrderConfirmation}
        />
      )}
    </main>
  )
}