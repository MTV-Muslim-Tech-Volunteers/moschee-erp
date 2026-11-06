import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { fitText } from "@/lib/pdf-text"
import { buildRevenueWeeklyReport, formatBerlinDate, formatBerlinTime, getISOWeekDateRange, type RevenueOrder } from "@/lib/kitchen"

interface RevenueQueryOrder extends RevenueOrder {
  customer_name: string | null
  is_cancelled: boolean
}

function drawCell(page: PDFPage, value: string, x: number, y: number, width: number, font: PDFFont, size = 8) {
  page.drawText(fitText(value, font, size, width - 6), { x: x + 3, y, size, font, color: rgb(0.08, 0.08, 0.08) })
}

function addTableHeader(page: PDFPage, title: string, y: number, font: PDFFont, bold: PDFFont) {
  page.drawText(title, { x: 42, y, size: 11, font: bold })
  return y - 18
}

function drawWeeklyReport(document: PDFDocument, report: ReturnType<typeof buildRevenueWeeklyReport>, font: PDFFont, bold: PDFFont) {
  const firstPageIndex = document.getPageCount()
  const { start, end } = getISOWeekDateRange(report.key)
  const dateLabel = (date: Date) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date)
  const weekNumber = report.key.split("-W")[1]
  let page = document.addPage([595.28, 841.89])
  let y = 798

  page.drawText("Einnahmenübersicht", { x: 42, y, size: 20, font: bold })
  y -= 22
  page.drawText(`Kalenderwoche ${weekNumber} · ${dateLabel(start)} - ${dateLabel(end)}`, { x: 42, y, size: 10, font })
  y -= 34

  const kpis = [
    ["Gesamteinnahmen", new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(report.total)],
    ["Anzahl Bestellungen", String(report.orderCount)],
    ["Ø pro Bestellung", new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(report.average)],
  ]
  const boxWidth = 164
  kpis.forEach(([label, value], index) => {
    const x = 42 + index * 170
    page.drawRectangle({ x, y: y - 43, width: boxWidth, height: 54, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.8 })
    page.drawText(label, { x: x + 8, y: y - 8, size: 8, font })
    page.drawText(fitText(value, bold, 12, boxWidth - 16), { x: x + 8, y: y - 29, size: 12, font: bold })
  })
  y -= 70

  y = addTableHeader(page, "Verkaufte Artikel", y, font, bold)
  page.drawText("Artikel", { x: 45, y, size: 8, font: bold })
  page.drawText("Menge", { x: 490, y, size: 8, font: bold })
  y -= 14
  for (const item of report.items) {
    page.drawText(fitText(item.name, font, 8, 420), { x: 45, y, size: 8, font })
    page.drawText(String(item.quantity), { x: 493, y, size: 8, font })
    y -= 13
  }
  if (report.items.length === 0) {
    page.drawText("Keine bezahlten Artikel", { x: 45, y, size: 8, font })
    y -= 13
  }
  y -= 8

  if (report.days.length > 1) {
    y = addTableHeader(page, "Pro Tag", y, font, bold)
    page.drawText("Datum", { x: 45, y, size: 8, font: bold })
    page.drawText("Bestellungen", { x: 280, y, size: 8, font: bold })
    page.drawText("Umsatz", { x: 450, y, size: 8, font: bold })
    y -= 14
    for (const day of report.days) {
      page.drawText(fitText(day.date, font, 8, 200), { x: 45, y, size: 8, font })
      page.drawText(String(day.orderCount), { x: 280, y, size: 8, font })
      page.drawText(new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(day.total), { x: 450, y, size: 8, font })
      y -= 13
    }
    y -= 8
  }

  const columns = [42, 105, 145, 225, 430, 485, 553]
  const columnLabels = ["Datum", "Zeit", "Kunde", "Artikel", "Status", "Summe"]
  const drawOrderHeader = () => {
    page.drawText("Alle Bestellungen", { x: 42, y, size: 11, font: bold })
    y -= 17
    page.drawRectangle({ x: 42, y: y - 4, width: 511, height: 17, color: rgb(0.9, 0.9, 0.9) })
    columnLabels.forEach((label, index) => drawCell(page, label, columns[index], y + 1, columns[index + 1] - columns[index], bold, 7.5))
    y -= 15
  }
  drawOrderHeader()
  let rowIndex = 0
  for (const order of report.orders) {
    const products = order.order_items.map((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products
      return `${item.quantity}x ${product?.name_de ?? "Unbekannt"}`
    })
    const lines = products.length > 0 ? products : ["- Keine Artikel -"]
    const status = order.is_cancelled ? "Storniert" : order.is_paid ? "Bezahlt" : "Offen"
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (y < 62) {
        page = document.addPage([595.28, 841.89])
        y = 798
        page.drawText(`Einnahmenübersicht - KW ${weekNumber} (Fortsetzung)`, { x: 42, y, size: 12, font: bold })
        y -= 28
        drawOrderHeader()
      }
      if (rowIndex % 2 === 1) page.drawRectangle({ x: 42, y: y - 4, width: 511, height: 17, color: rgb(0.96, 0.96, 0.96) })
      const firstLine = lineIndex === 0
      const values = [
        firstLine ? formatBerlinDate(order.created_at) : "",
        firstLine ? formatBerlinTime(order.created_at) : "",
        firstLine ? order.customer_name || "Unbekannt" : "",
        lines[lineIndex],
        firstLine ? status : "",
        firstLine ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(order.total_price ?? 0) : "",
      ]
      values.forEach((value, index) => drawCell(page, value, columns[index], y + 1, columns[index + 1] - columns[index], font, 7))
      if (firstLine && (!order.is_paid || order.is_cancelled)) {
        page.drawText("Nicht in Gesamteinnahmen enthalten", { x: 225, y: y - 9, size: 6, font, color: rgb(0.25, 0.25, 0.25) })
        y -= 8
      }
      y -= 13
      rowIndex += 1
    }
  }
  if (report.orders.length === 0) {
    page.drawText("Keine Bestellungen in dieser Kalenderwoche", { x: 45, y, size: 8, font })
    y -= 13
  }
  if (y < 72) {
    page = document.addPage([595.28, 841.89])
    y = 798
  }
  page.drawLine({ start: { x: 42, y: y - 4 }, end: { x: 553, y: y - 4 }, thickness: 0.8, color: rgb(0.2, 0.2, 0.2) })
  drawCell(page, "Summenzeile - bezahlte Bestellungen", 42, y - 17, 350, bold, 8)
  drawCell(page, new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(report.total), 485, y - 17, 68, bold, 8)

  const reportPages = document.getPages().slice(firstPageIndex)
  reportPages.forEach((reportPage, index) => {
    reportPage.drawLine({ start: { x: 42, y: 30 }, end: { x: 553, y: 30 }, thickness: 0.6, color: rgb(0.35, 0.35, 0.35) })
    reportPage.drawText(`Einnahmenübersicht - KW ${weekNumber} / ${report.key.slice(0, 4)}`, { x: 42, y: 17, size: 7, font })
    reportPage.drawText(`Seite ${firstPageIndex + index + 1}`, { x: 500, y: 17, size: 7, font })
  })
}

export async function POST(request: Request) {
  if ((await cookies()).get("gk_auth")?.value !== "role_finance") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: "Supabase-Konfiguration fehlt" }, { status: 500 })

  let requestedWeek: string | null = null
  try {
    const body: unknown = await request.json()
    if (typeof body === "object" && body !== null && "weekKey" in body && typeof body.weekKey === "string") {
      requestedWeek = body.weekKey
    }
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })
  }
  if (requestedWeek && !/^\d{4}-W\d{2}$/.test(requestedWeek)) return NextResponse.json({ error: "Ungültige Kalenderwoche" }, { status: 400 })

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.from("orders").select(`
    id, created_at, customer_name, total_price, is_paid, is_cancelled,
    order_items ( id, quantity, price_at_time, products ( name_de ) )
  `).order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: "Bestellungen konnten nicht geladen werden" }, { status: 500 })

  const orders = (data ?? []) as RevenueQueryOrder[]
  const weeks = requestedWeek ? [requestedWeek] : Array.from(new Set(orders.map((order) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(order.created_at))
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    const utcDate = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)))
    const day = utcDate.getUTCDay() || 7
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
    const year = utcDate.getUTCFullYear()
    const yearStart = new Date(Date.UTC(year, 0, 1))
    const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${year}-W${String(week).padStart(2, "0")}`
  }))).sort()
  if (weeks.length === 0) return NextResponse.json({ error: "Keine Bestellungen vorhanden" }, { status: 404 })

  const document = await PDFDocument.create()
  const font = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  for (const week of weeks) drawWeeklyReport(document, buildRevenueWeeklyReport(orders, week), font, bold)
  const bytes = await document.save()
  const body = new Uint8Array(bytes).buffer as ArrayBuffer
  const firstRange = getISOWeekDateRange(weeks[0])
  const lastRange = getISOWeekDateRange(weeks[weeks.length - 1])
  const filename = requestedWeek
    ? `Einnahmen_${requestedWeek}.pdf`
    : `Einnahmen_Gesamt_${firstRange.start.toISOString().slice(0, 10)}_${lastRange.end.toISOString().slice(0, 10)}.pdf`
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}