import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { canAccessProductChanges } from "@/lib/admin-products"

export default async function ChangePage() {
  const role = (await cookies()).get("gk_auth")?.value
  if (!canAccessProductChanges(role)) redirect("/login")
  redirect("/products/change")
}