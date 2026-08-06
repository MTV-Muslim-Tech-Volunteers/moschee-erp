import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Prüft die NEUE Tabelle 'inventory_items'
  const { data: lowStockItems, error: fetchError } = await supabaseAdmin
    .from("inventory_items")
    .select("*")
    .filter("stock", "lte", "low_stock_threshold")
    .or(`last_stock_notification.is.null,last_stock_notification.lt.${twentyFourHoursAgo}`);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!lowStockItems || lowStockItems.length === 0) {
    return NextResponse.json({ success: true, message: "Bestand im grünen Bereich." });
  }

  const emailHtml = `
    <h2>Lagerbestand Warnung (Küche)</h2>
    <p>Folgende Zutaten müssen nachgekauft werden:</p>
    <ul>
      ${lowStockItems.map(item => `<li><strong>${item.name}</strong>: Aktuell ${item.stock} Packungen (Warnung ab ${item.low_stock_threshold})</li>`).join("")}
    </ul>
  `;

  try {
    await resend.emails.send({
      from: "ERP System <noreply@deinedomain.com>",
      to: ["achmet.chakseven1@gmail.com"], 
      subject: "Lagerbestand Warnung - Auffüllen erforderlich",
      html: emailHtml,
    });

    const itemIds = lowStockItems.map(item => item.id);
    await supabaseAdmin
      .from("inventory_items")
      .update({ last_stock_notification: new Date().toISOString() })
      .in("id", itemIds);

    return NextResponse.json({ success: true, notifiedCount: lowStockItems.length });
  } catch (error) {
    return NextResponse.json({ error: "Emailversand fehlgeschlagen" }, { status: 500 });
  }
}