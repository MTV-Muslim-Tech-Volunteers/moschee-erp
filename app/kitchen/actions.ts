"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { getISOWeekDateRange } from "@/lib/kitchen"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function updateOrderStatus(id: string, data: { is_paid?: boolean; is_ready?: boolean }) {
  try {
    const { error } = await supabaseAdmin
      .from("orders")
      .update(data)
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}

export async function deleteOrder(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}

export async function updateProductAvailability(id: string, is_available: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_available })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}

export async function updateAllProductAvailability(is_available: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_available })
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}

export async function getMonthlyOrdersData(monthKey: string) {
  // monthKey comes in as "YYYY-MM" (z.B. "2026-06")
  const [yearStr, monthStr] = monthKey.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  // Startdatum des Monats
  const startDate = new Date(year, month - 1, 1).toISOString()
  // Startdatum des FOLGEMONATS (exklusiv)
  const endDate = new Date(year, month, 1).toISOString()

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        created_at,
        customer_name,
        total_price,
        is_paid,
        order_items (
          quantity,
          price_at_time,
          products ( name_de )
        )
      `)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at", { ascending: false }) // Neueste zuerst

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}

export async function getWeeklyOrdersData(weekKey: string) {
  if ((await cookies()).get("gk_auth")?.value !== "role_finance") {
    return { success: false, error: "Keine Berechtigung" }
  }

  const { start, end } = getISOWeekDateRange(weekKey)
  const endExclusive = new Date(end)
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        customer_name,
        total_price,
        is_paid,
        is_cancelled,
        order_items (
          quantity,
          price_at_time,
          products ( name_de )
        )
      `)
      .gte("created_at", start.toISOString())
      .lt("created_at", endExclusive.toISOString())
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten." }
  }
}

export async function updateInventoryStock(id: string, newStock: number) {
  try {
    const { error } = await supabaseAdmin
      .from("inventory_items")
      .update({ stock: newStock })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}