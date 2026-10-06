"use server"

import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Prüft, ob der Nutzer die nötige Rolle hat
async function isAuthorized() {
  const cookieStore = await cookies()
  const role = cookieStore.get("gk_auth")?.value
  return role === "role_finance" || role === "role_admin"
}

// Lädt alle Transaktionen für das Kassenbuch
export async function getTransactions() {
  if (!(await isAuthorized())) return { success: false, error: "Keine Berechtigung" }

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('receipt_number', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// Speichert neue Ausgaben aus dem Stapel
export async function saveTransactions(payload: Array<Record<string, unknown>>) {
  if (!(await isAuthorized())) return { success: false, error: "Keine Berechtigung" }

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert(payload)
    .select()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}