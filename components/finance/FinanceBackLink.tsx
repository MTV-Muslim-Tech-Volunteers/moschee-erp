import Link from "next/link"

export default function FinanceBackLink() {
  return (
    <Link
      href="/muhasebe"
      className="inline-flex min-h-10 items-center rounded-lg border border-[#5a4635] bg-[#181411] px-4 py-2 text-sm font-semibold text-stone-100 transition-colors hover:border-[#d9a36c]/60 hover:bg-[#2a2019]"
    >
      ← Zurück zu Muhasebe
    </Link>
  )
}