import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import ProductManagement from "@/components/admin/ProductManagement"
import { canAccessProductChanges } from "@/lib/admin-products"
import FinanceBackLink from "@/components/finance/FinanceBackLink"

export default async function ProductChangePage() {
  const role = (await cookies()).get("gk_auth")?.value
  if (!canAccessProductChanges(role)) redirect("/login")

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] px-4 py-10 text-stone-100 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <FinanceBackLink />
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9a36c]">Finance</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Produkte ändern</h1>
            <p className="mt-2 text-sm text-stone-400">Preise und Verfügbarkeit des Sortiments verwalten.</p>
          </div>
          <Link href="/products" className="inline-flex min-h-10 items-center rounded-lg border border-[#5a4635] bg-[#181411] px-4 py-2 text-sm font-semibold text-stone-100 transition-colors hover:bg-[#2a2019]">Zurück zu Produkten</Link>
        </div>
        <ProductManagement />
      </div>
    </main>
  )
}