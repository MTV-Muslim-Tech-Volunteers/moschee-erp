"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserRole } from "@/lib/auth";

export async function deleteOrderAction(orderId: string) {
  // 1. Serverseitige Rollenüberprüfung
  const role = await getUserRole();

  if (role !== "admin" && role !== "mitarbeiter") {
    return { success: false, error: "Fehlende Berechtigung für diese Aktion." };
  }

  // 2. Datenbankoperation bei Erfolg (RLS fängt es zusätzlich nochmals ab)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; }
      },
    }
  );

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}