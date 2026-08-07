"use server"
import { cookies } from "next/headers"

export async function login(formData: FormData) {
  const username = formData.get("username")
  const password = formData.get("password")

  const validAdminUser = process.env.ADMIN_USERNAME
  const validAdminPass = process.env.ADMIN_PASSWORD

  const validFinanceUser = process.env.FINANCE_USERNAME
  const validFinancePass = process.env.FINANCE_PASSWORD

  const cookieStore = await cookies()

  // Check 1: Küchen/Produkte Admin
  if (username === validAdminUser && password === validAdminPass) {
    cookieStore.set("gk_auth", "role_admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    return { success: true }
  }

  // Check 2: Finanz Admin
  if (username === validFinanceUser && password === validFinancePass) {
    cookieStore.set("gk_auth", "role_finance", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    return { success: true }
  }

  return { success: false, error: "Benutzername oder Passwort ist falsch." }
}