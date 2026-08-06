import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // Sicherheit: Überprüfen, ob der Aufruf wirklich von Vercel Cron kommt
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service Role Key für Admin-Operationen im Cron-Job nutzen
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Vergangenen Monat berechnen
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const startIso = periodStart.toISOString();
  const endIso = periodEnd.toISOString();

  // Daten aggregieren
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name_de, name_tr))")
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("*");

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  // JSON Struktur für den Export aufbauen
  const aggregatedData = {
    totalOrders: orders.length,
    revenue: orders.reduce((sum, order) => sum + (order.total_price || 0), 0),
    stockSnapshot: products,
    rawOrders: orders,
  };

  // Datensatz in monthly_exports anlegen
  const { error: insertError } = await supabaseAdmin
    .from("monthly_exports")
    .insert({
      period_start: startIso,
      period_end: endIso,
      data: aggregatedData,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, periodStart, periodEnd });
}