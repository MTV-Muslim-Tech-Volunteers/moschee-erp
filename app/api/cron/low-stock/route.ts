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

  const { data: potentialItems, error: fetchError } = await supabaseAdmin
    .from("inventory_items")
    .select("*")
    .or(`last_stock_notification.is.null,last_stock_notification.lt.${twentyFourHoursAgo}`);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const lowStockItems = potentialItems?.filter(
    (item) => item.stock <= item.low_stock_threshold
  ) || [];

  if (lowStockItems.length === 0) {
    return NextResponse.json({ success: true, message: "Bestand im grünen Bereich oder Benachrichtigungs-Cooldown aktiv." });
  }

  const emailHtml = `
    <h2>Lagerbestand Warnung (Küche)</h2>
    <p>Folgende Zutaten müssen nachgekauft werden:</p>
    <ul>
      ${lowStockItems.map(item => `<li><strong>${item.name}</strong>: Aktuell ${item.stock} Packungen (Warnung ab${item.low_stock_threshold})</li>`).join("")}
    </ul>
  `;

  const { data: resendData, error: resendError } = await resend.emails.send({
    from: "Moschee ERP <noreply@gk.chakseven.com>",
    to: ["gk-ditib@chakseven.com"],
    subject: "Lagerbestand Warnung - Auffüllen erforderlich",
    html: emailHtml,
  });

  if (resendError) {
    console.error("Resend API Fehler:", resendError);
    return NextResponse.json({ error: "Emailversand fehlgeschlagen", details: resendError }, { status: 500 });
  }

  const itemIds = lowStockItems.map(item => item.id);

  const { error: updateError } = await supabaseAdmin
    .from("inventory_items")
    .update({ last_stock_notification: new Date().toISOString() })
    .in("id", itemIds);

  if (updateError) {
    console.error("Supabase Update Fehler:", updateError);
  }

  return NextResponse.json({ success: true, notifiedCount: lowStockItems.length, emailId: resendData?.id });
}