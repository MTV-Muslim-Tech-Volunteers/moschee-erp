"use client"

import Link from 'next/link'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { ArrowLeft, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  updateOrderStatus,
  deleteOrder as deleteOrderAction,
  updateProductAvailability,
  updateAllProductAvailability,
  updateInventoryStock,
} from './actions'

import RevenuePanel from '@/components/kitchen/RevenuePanel'
import ProductAvailabilityPanel from '@/components/kitchen/ProductAvailabilityPanel'
import OrderCard from '@/components/kitchen/OrderCard'
import InventoryPanel from '@/components/kitchen/InventoryPanel'

interface Product {
  id: string
  name_de: string
  name_tr: string
  is_available: boolean
}

interface OrderItem {
  id: string
  quantity: number
  price_at_time: number
  products: {
    id: string
    name_de: string
    name_tr: string
    is_available: boolean
  } | null
}

interface Order {
  id: string
  created_at: string
  customer_name: string | null
  total_price: number | null
  is_paid: boolean
  is_ready: boolean
  order_items: OrderItem[]
}

interface RevenueOrder {
  id: string
  created_at: string
  total_price: number | null
  is_paid: boolean
}

interface InventoryItem {
   id: string;
   name: string;
   stock: number;
}

const MemoizedRevenuePanel = React.memo(RevenuePanel)
const MemoizedProductAvailabilityPanel = React.memo(ProductAvailabilityPanel)
const MemoizedOrderCard = React.memo(OrderCard)

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [revenueOrders, setRevenueOrders] = useState<RevenueOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mountedRef = useRef(true)
  const pollingRef = useRef<number | null>(null)

  const activeItemsSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    orders
      .filter((o) => !o.is_ready)
      .forEach((order) => {
        order.order_items.forEach((item) => {
          const name = item.products?.name_de ?? "Unbekanntes Produkt"
          counts[name] = (counts[name] || 0) + item.quantity
        })
      })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [orders])

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
          products ( id, name_de, name_tr, is_available )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data && mountedRef.current) {
      setOrders(data as Order[])
      setLastRefresh(new Date())
    }
  }, [])

  const fetchRevenueOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total_price, is_paid")
      .eq("is_paid", true)
      .order("created_at", { ascending: false })

    if (!error && data && mountedRef.current) {
      setRevenueOrders(data as RevenueOrder[])
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name_de, name_tr, is_available")
      .order("name_de", { ascending: true })

    if (!error && data && mountedRef.current) {
      setProducts(data as Product[])
    }
  }, [])

  const fetchInventory = useCallback(async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, stock")
      .order("name", { ascending: true })
    if (!error && data && mountedRef.current) {
      setInventory(data as InventoryItem[])
    }
  }, [])

  const refreshData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchOrders(), fetchRevenueOrders(), fetchProducts(), fetchInventory()])
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false)
        }
      })
  }, [fetchOrders, fetchProducts, fetchRevenueOrders, fetchInventory])

  const silentRefresh = useCallback(async () => {
    await Promise.all([fetchOrders(), fetchRevenueOrders(), fetchProducts(), fetchInventory()])
  }, [fetchOrders, fetchProducts, fetchRevenueOrders, fetchInventory])

  useEffect(() => {
    mountedRef.current = true
    refreshData()
    let timeoutId: number | undefined
    const handleRealtimeChange = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        silentRefresh()
      }, 500)
    }

    const channel = supabase
      .channel("kitchen-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, handleRealtimeChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, handleRealtimeChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, handleRealtimeChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, handleRealtimeChange)
      .subscribe()

    pollingRef.current = window.setInterval(() => {
      silentRefresh()
    }, 10000)

    return () => {
      mountedRef.current = false
      clearTimeout(timeoutId)
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [fetchOrders, fetchProducts, fetchRevenueOrders, fetchInventory, refreshData, silentRefresh])

  const togglePaid = useCallback(async (id: string, current: boolean) => {
    const result = await updateOrderStatus(id, { is_paid: !current })
    if (result.success) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, is_paid: !current } : o)))
      fetchRevenueOrders()
    } else {
      alert("Fehler beim Bezahlen: " + result.error)
    }
  }, [fetchRevenueOrders])

  const toggleReady = useCallback(async (id: string, current: boolean) => {
    const result = await updateOrderStatus(id, { is_ready: !current })
    if (result.success) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, is_ready: !current } : o)))
    } else {
      alert("Fehler beim Status-Update: " + result.error)
    }
  }, [])

  const deleteOrder = useCallback(async (id: string) => {
    const result = await deleteOrderAction(id)
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== id))
      fetchRevenueOrders()
    } else {
      alert("Fehler beim Stornieren: " + result.error)
    }
  }, [fetchRevenueOrders])

  const toggleProductAvailability = useCallback(
    async (id: string, current: boolean) => {
      const result = await updateProductAvailability(id, !current)
      if (result.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_available: !current } : p))
        )
        fetchOrders()
      }
    },
    [fetchOrders]
  )

  const toggleAllProductAvailability = useCallback(
    async (available: boolean) => {
      const result = await updateAllProductAvailability(available)
      if (result.success) {
        setProducts((prev) => prev.map((p) => ({ ...p, is_available: available })))
        fetchOrders()
      }
    },
    [fetchOrders]
  )

  const handleStockChange = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta) 
    setInventory(prev => prev.map(item => item.id === id ? { ...item, stock: newStock } : item))
    
    const result = await updateInventoryStock(id, newStock)
    if (!result.success) {
      alert("Fehler beim Speichern des Bestands: " + result.error)
      fetchInventory() 
    }
  }

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarOpen])

  const filtered = useMemo(
    () => orders.filter((o) => {
      if (filter === "active") return !o.is_ready
      if (filter === "completed") return o.is_ready
      return true
    }),
    [filter, orders]
  )

  const activeCount = useMemo(
    () => orders.filter((o) => !o.is_ready).length,
    [orders]
  )

  const escalationSummary = useMemo(() => {
    let yellowCount = 0
    let redCount = 0
    orders.forEach((order) => {
      if (order.is_ready) return
      const elapsedMinutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
      const hasUnavailable = order.order_items.some((item) => item.products && !item.products.is_available)
      
      if (hasUnavailable || elapsedMinutes >= 30) {
        redCount += 1
      } else if (elapsedMinutes >= 15) {
        yellowCount += 1
      }
    })
    return {
      yellowCount,
      redCount,
      totalCount: yellowCount + redCount,
      worstLabel: redCount > 0 ? 'Überfällig' : 'wartet'
    }
  }, [orders])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        
        {/* Sidebar Anpassung hier: h-full hinzugefügt */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[min(22rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-hidden rounded-r-3xl border border-[#2d241d] bg-[#181411]/96 shadow-2xl shadow-black/35 transition-all duration-300 ${sidebarOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-[110%] opacity-0 pointer-events-none'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex shrink-0 items-start justify-between border-b border-[#2d241d] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">Küchensteuerung</p>
                <h1 className="mt-1 text-lg font-bold tracking-tight text-stone-100">Sidebar</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-full border border-[#31271f] p-2 text-stone-300 transition-colors hover:bg-[#231b16]"
                aria-label="Sidebar schließen"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <MemoizedProductAvailabilityPanel
                products={products}
                onToggle={toggleProductAvailability}
                onToggleAll={toggleAllProductAvailability}
              />
              <MemoizedRevenuePanel orders={revenueOrders} />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-[#2c241d] bg-[#15110e]/92 p-4 shadow-sm shadow-black/30 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#31271f] bg-[#1a1512] px-3 py-2 text-sm font-medium transition-colors hover:bg-[#231b16]"
                  aria-expanded={sidebarOpen}
                  type="button"
                >
                  <Menu className="h-4 w-4" />
                  {sidebarOpen ? 'Bereiche schließen' : 'Bereiche öffnen'}
                </button>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Küchenansicht</h2>
                  <p className="mt-0.5 text-sm text-stone-400">
                    Zuletzt aktualisiert: {lastRefresh.toLocaleTimeString("de-DE")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/kitchen/quick-order"
                className="inline-flex items-center gap-2 rounded-xl border border-[#5a4228] bg-[#d9a36c] px-3 py-2 text-sm font-semibold text-[#24160e] transition-colors hover:bg-[#e4b37d]"
                title="Schnelle Bestellung aufnehmen"
              >
                Quick Order
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-[#31271f] bg-[#1a1512] px-3 py-2 text-sm font-medium transition-colors hover:bg-[#231b16]"
                title="Zurück zum Login"
              >
                <ArrowLeft className="h-4 w-4" />
                Login
              </Link>
              <button
                onClick={refreshData}
                className="inline-flex items-center gap-2 rounded-xl border border-[#31271f] bg-[#1a1512] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#231b16]"
                type="button"
              >
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Extrahierte Inventar-Komponente */}
          <InventoryPanel inventory={inventory} onStockChange={handleStockChange} />

          {activeItemsSummary.length > 0 && filter !== "completed" && (
            <div className="rounded-2xl border border-[#2c241d] bg-[#181411] shadow-sm p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d9a36c] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d9a36c]"></span>
                </span>
                Quick Overview (Noch zuzubereiten)
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {activeItemsSummary.map(([name, quantity]) => (
                  <div key={name} className="flex items-center gap-2 rounded-lg border border-[#2f261f] bg-[#14110e] px-3 py-2 shadow-sm">
                    <span className="text-lg leading-none font-bold text-[#d9a36c]">{quantity}x</span>
                    <span className="text-sm font-medium text-stone-100">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex w-full items-stretch gap-3">
            <div className={`inline-flex min-w-0 flex-nowrap gap-1 rounded-2xl border border-[#2c241d] bg-[#15110e] p-1 ${escalationSummary.totalCount > 0 ? 'w-1/2' : 'flex-1'}`}>
              {(["active", "all", "completed"] as const).map((f) => {
                const labels = { active: "In Zubereitung", all: "Alle", completed: "Erledigt" }
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      filter === f
                        ? "bg-[#d9a36c] text-[#20150d] shadow-sm"
                        : "text-stone-400 hover:text-stone-100"
                    }`}
                    type="button"
                  >
                    {labels[f]}
                    {f === "active" && activeCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-[#d9a36c] px-1.5 py-0.5 text-xs font-bold text-[#20150d]">
                        {activeCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {escalationSummary.totalCount > 0 && (
              <div className={`flex w-1/2 min-w-0 shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
                escalationSummary.redCount > 0
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              }`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                  escalationSummary.redCount > 0 ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200'
                }`}>
                  ⚠
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    {escalationSummary.redCount > 0
                      ? `${escalationSummary.redCount} ${escalationSummary.redCount === 1 ? 'Bestellung überfällig' : 'Bestellungen überfällig'}`
                      : `${escalationSummary.yellowCount} ${escalationSummary.yellowCount === 1 ? 'Bestellung wartet' : 'Bestellungen warten'}`}
                  </p>
                  <p className="text-xs text-current/75">
                    {escalationSummary.redCount > 0
                      ? 'Rote Bestellungen haben Priorität!'
                      : 'Gelbe Bestellungen sollten bald vorbereitet werden'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid justify-start grid-cols-[repeat(auto-fit,minmax(240px,240px))] gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl border border-[#2c241d] bg-[#181411] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2c241d] bg-[#181411]/80 px-5 py-8 text-center text-stone-400">
              <p className="text-sm font-medium text-stone-200">Für diesen Filter gibt es gerade keine Bestellungen.</p>
              <p className="mt-1 text-xs">Ein kurzer Refresh oder ein anderer Tab zeigt dir wieder Inhalte.</p>
            </div>
          ) : (
            <div className="grid justify-start grid-flow-row auto-rows-max grid-cols-[repeat(auto-fit,minmax(240px,240px))] items-start gap-3">
              {filtered.map((order) => (
                <MemoizedOrderCard
                  key={order.id}
                  order={order}
                  onTogglePaid={togglePaid}
                  onToggleReady={toggleReady}
                  onDeleteOrder={deleteOrder}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}