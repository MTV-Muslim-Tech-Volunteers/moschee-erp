"use server"

import { cookies } from "next/headers"

export async function login(formData: FormData) {
  const username = formData.get("username")
  const password = formData.get("password")

  const validUsername = process.env.ADMIN_USERNAME 
  const validPassword = process.env.ADMIN_PASSWORD

  // Zugangsdaten prüfen
  if (username === validUsername && password === validPassword) {
    // WICHTIG: await vor cookies() setzen!
    const cookieStore = await cookies()
    
    cookieStore.set("gk_auth", "authenticated", {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 60 * 60 * 24 * 30, 
      path: "/", 
    })
    
    return { success: true }
  }

  return { success: false, error: "Benutzername oder Passwort ist falsch." }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("gk_auth")
}