"use client"

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
import { formatTime, timeSince, formatEur, buildRevenueData, monthLabel, weekLabel } from '@/lib/kitchen'

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

// Interface für das Inventar
interface InventoryItem { 
  id: string; 
  name: string; 
  stock: number; 
}

// Helpers and panels moved to lib/kitchen and components/kitchen
const MemoizedRevenuePanel = React.memo(RevenuePanel)
const MemoizedProductAvailabilityPanel = React.memo(ProductAvailabilityPanel)
const MemoizedOrderCard = React.memo(OrderCard)

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [revenueOrders, setRevenueOrders] = useState<RevenueOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // State für das Inventar
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const mountedRef = useRef(true)
  const pollingRef = useRef<number | null>(null)

  const activeItemsSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    orders
      .filter((o) => !o.is_ready) // Nur noch nicht fertige Bestellungen
      .forEach((order) => {
        order.order_items.forEach((item) => {
          const name = item.products?.name_de ?? "Unbekanntes Produkt"
          counts[name] = (counts[name] || 0) + item.quantity
        })
      })
      
    // Konvertieren in ein Array und nach höchster Menge sortieren
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

  // Inventar laden
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
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, handleRealtimeChange) // Auf Inventar-Änderungen reagieren
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

  // Handler für Bestandsänderung (Packungen)
  const handleStockChange = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta) // Verhindert negative Zahlen
    
    // Optimistic UI Update
    setInventory(prev => prev.map(item => item.id === id ? { ...item, stock: newStock } : item))
    
    // Server Update
    const result = await updateInventoryStock(id, newStock)
    if (!result.success) {
      alert("Fehler beim Speichern des Bestands: " + result.error)
      fetchInventory() // Bei Fehler zurücksetzen
    }
  }

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

  return (
    <main className="min-h-screen bg-muted/40 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Küchenansicht
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Zuletzt aktualisiert: {lastRefresh.toLocaleTimeString("de-DE")}
            </p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            Aktualisieren
          </button>
        </div>

        <MemoizedRevenuePanel orders={revenueOrders} />

        <MemoizedProductAvailabilityPanel
          products={products}
          onToggle={toggleProductAvailability}
          onToggleAll={toggleAllProductAvailability}
        />

        {/* Lagerbestand Panel für die Packungen */}
        <div className="rounded-2xl border bg-card shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
             Lagerbestand Zutaten (Packungen)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inventory.map((item) => (
              <div key={item.id} className="flex flex-col items-center justify-between bg-muted/50 rounded-xl p-3 border">
                <span className="text-sm font-medium mb-2">{item.name}</span>
                <div className="flex items-center gap-3 bg-background border rounded-lg p-1">
                  <button 
                    onClick={() => handleStockChange(item.id, item.stock, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-bold">{item.stock}</span>
                  <button 
                    onClick={() => handleStockChange(item.id, item.stock, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeItemsSummary.length > 0 && filter !== "completed" && (
          <div className="rounded-2xl border bg-card shadow-sm p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Quick Overview (Noch zuzubereiten)
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {activeItemsSummary.map(([name, quantity]) => (
                <div
                  key={name}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border shadow-sm"
                >
                  <span className="font-bold text-primary text-lg leading-none">{quantity}x</span>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="inline-flex rounded-lg border bg-background p-1 gap-1">
          {(["active", "all", "completed"] as const).map((f) => {
            const labels = { active: "In Zubereitung", all: "Alle", completed: "Erledigt" }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[f]}
                {f === "active" && activeCount > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {activeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card h-52 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground space-y-2">
            <p className="text-sm">Keine Bestellungen in dieser Ansicht</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </main>
  )
}