import { PDFDocument, StandardFonts } from "pdf-lib"
import { describe, expect, it } from "vitest"
import { fitText, toPdfSafeText } from "./pdf-text"

async function helvetica() {
  return (await PDFDocument.create()).embedFont(StandardFonts.Helvetica)
}

describe("toPdfSafeText", () => {
  it("keeps WinAnsi characters", async () => {
    expect(toPdfSafeText("Käse Öl ß € Ø", await helvetica())).toBe("Käse Öl ß € Ø")
  })

  it("transliterates Turkish letters", async () => {
    expect(toPdfSafeText("Işıl Çağrı Şükrü", await helvetica())).toBe("Isil Çagri Sükrü")
  })

  it("removes characters the font cannot encode", async () => {
    const font = await helvetica()
    const text = toPdfSafeText("Ali 😀 مرحبا Őrs", font)
    expect(text).toBe("Ali Ors")
    expect(() => font.widthOfTextAtSize(text, 8)).not.toThrow()
  })

  it("replaces newlines and tabs with spaces", async () => {
    const font = await helvetica()
    const text = toPdfSafeText("Zeile 1\nZeile 2\t!", font)
    expect(text).toBe("Zeile 1 Zeile 2 !")
    expect(() => font.widthOfTextAtSize(text, 8)).not.toThrow()
  })
})

describe("fitText", () => {
  it("returns short text unchanged", async () => {
    expect(fitText("Tee", await helvetica(), 8, 200)).toBe("Tee")
  })

  it("truncates long text within the width and terminates", async () => {
    const font = await helvetica()
    const text = fitText("Sehr lange Bezeichnung ".repeat(20), font, 8, 100)
    expect(text.endsWith("...")).toBe(true)
    expect(font.widthOfTextAtSize(text, 8)).toBeLessThanOrEqual(100)
  })

  it("returns an empty string when nothing fits", async () => {
    expect(fitText("Tee", await helvetica(), 8, 1)).toBe("")
  })
})
