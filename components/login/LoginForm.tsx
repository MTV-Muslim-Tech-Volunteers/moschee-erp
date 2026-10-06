"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/login/actions"

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await login(new FormData(event.currentTarget))

    if (result.success) {
      router.push("admin")
      router.refresh()
    } else {
      setError(result.error || "Ein Fehler ist aufgetreten.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive animate-in fade-in">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground" htmlFor="username">Benutzername</label>
        <input id="username" name="username" type="text" required autoComplete="username" placeholder="Benutzername eingeben" className="w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground" htmlFor="password">Passwort</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50">
        {isLoading ? (
          <svg className="h-5 w-5 animate-spin text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : "Anmelden"}
      </button>
    </form>
  )
}