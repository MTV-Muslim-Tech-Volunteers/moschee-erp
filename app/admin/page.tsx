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
  const canAccessKitchenAndProducts = isAdmin || isFinance

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] px-4 py-10 text-stone-100 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl border border-[#2c241d] bg-[#181411] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9a36c]">Verwaltung</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">System Hub</h1>
          <p className="mt-2 text-sm text-stone-400">Wähle einen Bereich aus, um fortzufahren.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Bereich 1: Küche & Produkte (role_admin) */}
          <Link
            href={canAccessKitchenAndProducts ? "/kitchen" : "#"}
            className={`rounded-2xl border border-[#2c241d] bg-[#181411] p-6 transition-all ${canAccessKitchenAndProducts ? "hover:-translate-y-0.5 hover:border-[#d9a36c]/60 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]" : "cursor-not-allowed opacity-40"}`}
          >
            <h2 className="mb-2 text-xl font-semibold text-stone-100">Küche</h2>
            <p className="text-sm text-stone-400">Bestellungen einsehen, abhaken und Lagerbestand prüfen.</p>
          </Link>

          <Link
            href={canAccessKitchenAndProducts ? "/products" : "#"}
            className={`rounded-2xl border border-[#2c241d] bg-[#181411] p-6 transition-all ${canAccessKitchenAndProducts ? "hover:-translate-y-0.5 hover:border-[#d9a36c]/60 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]" : "cursor-not-allowed opacity-40"}`}
          >
            <h2 className="mb-2 text-xl font-semibold text-stone-100">Produkte verwalten</h2>
            <p className="text-sm text-stone-400">Neue Artikel anlegen und Speisekarte bearbeiten.</p>
          </Link>

          {/* Bereich 2: Finanzen (role_finance) */}
          <Link
            href={isFinance ? "/muhasebe" : "#"}
            className={`rounded-2xl border border-[#2c241d] bg-[#181411] p-6 transition-all ${isFinance ? "hover:-translate-y-0.5 hover:border-[#d9a36c]/60 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]" : "cursor-not-allowed opacity-40"}`}
          >
            <h2 className="mb-2 text-xl font-semibold text-stone-100">Muhasebe</h2>
            <p className="text-sm text-stone-400">Sortiment, Preise, Einnahmen und Ausgaben verwalten.</p>
          </Link>

        </div>
      </div>
    </main>
  )
}