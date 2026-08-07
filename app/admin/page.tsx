import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const role = cookieStore.get("gk_auth")?.value

  if (!role) {
    redirect("/login")
  }

  const isFinance = role === "role_finance"
  const isAdmin = role === "role_admin"

  return (
    <main className="min-h-screen bg-muted/40 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Hub</h1>
          <p className="text-muted-foreground mt-2">Wähle einen Bereich aus, um fortzufahren.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bereich 1: Küche & Produkte (role_admin) */}
          <Link
            href={isAdmin ? "/kitchen" : "#"}
            className={`p-6 rounded-2xl border bg-card transition-all ${isAdmin ? "hover:shadow-md hover:border-primary/50" : "opacity-40 cursor-not-allowed"}`}
          >
            <h2 className="text-xl font-semibold mb-2">Küche</h2>
            <p className="text-sm text-muted-foreground">Bestellungen einsehen, abhaken und Lagerbestand prüfen.</p>
          </Link>

          <Link
            href={isAdmin ? "/produkte" : "#"}
            className={`p-6 rounded-2xl border bg-card transition-all ${isAdmin ? "hover:shadow-md hover:border-primary/50" : "opacity-40 cursor-not-allowed"}`}
          >
            <h2 className="text-xl font-semibold mb-2">Produkte verwalten</h2>
            <p className="text-sm text-muted-foreground">Neue Artikel anlegen und Speisekarte bearbeiten.</p>
          </Link>

          {/* Bereich 2: Finanzen (role_finance) */}
          <Link
            href={isFinance ? "/kassenbuch" : "#"}
            className={`p-6 rounded-2xl border bg-card transition-all ${isFinance ? "hover:shadow-md hover:border-emerald-500/50" : "opacity-40 cursor-not-allowed"}`}
          >
            <h2 className="text-xl font-semibold mb-2">Kassenbuch</h2>
            <p className="text-sm text-muted-foreground">Gesamte Einnahmen- und Ausgaben-Historie.</p>
          </Link>

          <Link
            href={isFinance ? "/ausgaben" : "#"}
            className={`p-6 rounded-2xl border bg-card transition-all ${isFinance ? "hover:shadow-md hover:border-emerald-500/50" : "opacity-40 cursor-not-allowed"}`}
          >
            <h2 className="text-xl font-semibold mb-2">Ausgaben erfassen</h2>
            <p className="text-sm text-muted-foreground">Neue Belege, Einkäufe und Ausgaben buchen.</p>
          </Link>
        </div>
      </div>
    </main>
  )
}