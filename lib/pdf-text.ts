const TRANSLITERATIONS: Record<string, string> = { ı: "i", İ: "I", ş: "s", Ş: "S", ğ: "g", Ğ: "G" }

// Standard PDF fonts throw on characters outside WinAnsi (emoji, Arabic, newlines, ...).
export function toPdfSafeText(value: string, font: { getCharacterSet(): number[] }): string {
  const supported = new Set(font.getCharacterSet())
  let result = ""
  for (const character of value.replace(/[\u2010-\u2015]/g, "-").replace(/\u2022/g, "-").replace(/\s+/g, " ")) {
    const replacement = TRANSLITERATIONS[character] ?? character
    if ([...replacement].every((part) => supported.has(part.codePointAt(0)!))) {
      result += replacement
      continue
    }
    result += character.normalize("NFD").replace(/[^\x20-\x7e]/g, "")
  }
  return result.replace(/ {2,}/g, " ").trim()
}

export function fitText(value: string, font: { getCharacterSet(): number[]; widthOfTextAtSize(text: string, size: number): number }, size: number, width: number): string {
  const text = toPdfSafeText(value, font)
  if (font.widthOfTextAtSize(text, size) <= width) return text
  let end = text.length
  while (end > 0 && font.widthOfTextAtSize(`${text.slice(0, end)}...`, size) > width) end -= 1
  return end > 0 ? `${text.slice(0, end)}...` : ""
}
