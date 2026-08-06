"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { login } from "./actions"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Formulardaten auslesen
    const formData = new FormData(e.currentTarget)
    
    // Server Action aufrufen
    const result = await login(formData)

    if (result.success) {
      // Bei Erfolg leiten wir den Nutzer in die Küche weiter
      router.push("/kitchen")
      router.refresh() // Wichtig: Zwingt Next.js dazu, das neue Cookie zu registrieren
    } else {
      // Fehler anzeigen und Lade-Zustand beenden
      setError(result.error || "Ein Fehler ist aufgetreten.")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ── Header ── */}
        <div className="flex flex-col items-center justify-center p-8 border-b bg-muted/20">
          <div className="w-20 h-20 bg-background rounded-full border shadow-sm flex items-center justify-center mb-5 relative overflow-hidden">
            <Image 
              src="/ditib-gk-logo.png" 
              alt="Logo" 
              fill 
              className="object-cover" 
              priority 
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Login
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            Bitte melde dich an, um auf die Verwaltung und die Küche zuzugreifen.
          </p>
        </div>

        {/* ── Formular ── */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Fehlermeldung (nur sichtbar, wenn etwas schiefgeht) */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Benutzername */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="username">
                Benutzername
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Benutzername eingeben"
                className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Passwort */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="password">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center mt-2 shadow-md shadow-primary/20"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Anmelden"
              )}
            </button>
            
          </form>
        </div>
      </div>
    </main>
  )
}