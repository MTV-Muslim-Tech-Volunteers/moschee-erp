"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

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
