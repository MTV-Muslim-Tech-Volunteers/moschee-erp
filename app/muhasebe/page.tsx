import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import RevenueOverview from "@/components/muhasebe/RevenueOverview"

const financeSections = [
  {
    href: "/products",
    label: "Produkte",
    title: "Produkte anlegen",
    description: "Neue Speisen, Getränke und Merch-Artikel mit deutschen und türkischen Informationen erfassen.",
  },
  {
    href: "/products/change",
    label: "Sortiment",
    title: "Preise & Verfügbarkeit",
    description: "Preise ändern, Produkte temporär ausblenden oder Artikel dauerhaft aus dem Sortiment entfernen.",
  },
  {
    href: "/kassenbuch",
    label: "Finanzen",
    title: "Kassenbuch",
    description: "Einnahmen und Ausgaben nachvollziehen und die Kassenbewegungen prüfen.",
  },
  {
    href: "/ausgaben",
    label: "Finanzen",
    title: "Ausgaben erfassen",
    description: "Belege und sonstige Ausgaben strukturiert dokumentieren.",
  },
]

export default async function MuhasebePage() {
  const role = (await cookies()).get("gk_auth")?.value
  if (role !== "role_finance") redirect("/login")

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] px-4 py-10 text-stone-100 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-[#2c241d] bg-[#181411] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9a36c]">Finance</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Muhasebe</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">Hier findest du alle Bereiche für Sortiment, Preise, Einnahmen und Ausgaben an einem Ort.</p>
            </div>
            <Link href="/login" className="inline-flex min-h-10 items-center rounded-lg border border-[#5a4635] bg-[#0f0d0b] px-4 py-2 text-sm font-semibold text-stone-100 transition-colors hover:border-[#d9a36c]/60 hover:bg-[#2a2019]">
              ← Zurück zum Login
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-[#2c241d] bg-[#181411] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-6">
          <div className="mb-4 border-b border-[#2c241d] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9a36c]">Überblick</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-100">Einnahmenübersicht</h2>
            <p className="mt-1 text-sm text-stone-400">Bezahlte Bestellungen nach Kalenderwoche und Zeitraum, inklusive CSV-Export.</p>
          </div>
          <RevenueOverview />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {financeSections.map((section) => (
            <Link key={section.href} href={section.href} className="group rounded-2xl border border-[#2c241d] bg-[#181411] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d9a36c]/60 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9a36c]">{section.label}</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-100">{section.title}</h2>
                </div>
                <span className="text-xl text-[#d9a36c] transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-400">{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}