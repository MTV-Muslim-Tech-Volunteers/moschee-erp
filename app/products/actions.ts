"use server"

import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { canAccessProductChanges } from "@/lib/admin-products"

async function requireFinanceRole() {
  return canAccessProductChanges((await cookies()).get("gk_auth")?.value)
}

export async function createProduct(formData: {
  name_de: string
  name_tr: string
  description_de: string
  description_tr: string
  category: string
  price: number
  image_url: string | null
}) {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .insert([formData])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
    return { success: false, error: errorMessage }
  }
}

export async function updateProduct(id: string, data: {
  name_de?: string
  name_tr?: string
  description_de?: string
  description_tr?: string
  category?: string
  price?: number
  image_url?: string | null
}) {
  try {
    if (!(await requireFinanceRole())) return { success: false, error: "Keine Berechtigung." }
    const { error } = await supabaseAdmin.from("products").update(data).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten." }
  }
}

export async function updateProductAvailability(id: string, is_available: boolean) {
  try {
    if (!(await requireFinanceRole())) return { success: false, error: "Keine Berechtigung." }
    const { error } = await supabaseAdmin.from("products").update({ is_available }).eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten." }
  }
}

export async function deleteProduct(id: string) {
  try {
    if (!(await requireFinanceRole())) return { success: false, error: "Keine Berechtigung." }
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten." }
  }
}
