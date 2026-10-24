"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import RevenuePanel from "@/components/kitchen/RevenuePanel"
import type { RevenueOrder } from "@/lib/kitchen"

export default function RevenueOverview() {
  const [orders, setOrders] = useState<RevenueOrder[]>([])

  useEffect(() => {
    let mounted = true

    async function loadRevenue() {
      const { data } = await supabase
        .from("orders")
        .select("id, created_at, total_price, is_paid")
        .eq("is_paid", true)
        .order("created_at", { ascending: false })

      if (mounted) setOrders((data ?? []) as RevenueOrder[])
    }

    void loadRevenue()
    const channel = supabase
      .channel("muhasebe-revenue-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void loadRevenue()
      })
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [])

  return <RevenuePanel orders={orders} />
}