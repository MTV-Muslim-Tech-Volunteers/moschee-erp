"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { createProduct } from './actions'

import ProductForm from '@/components/admin/ProductForm'
import { uploadImage, ProductFormData } from '@/lib/admin'

const EMPTY_FORM: ProductFormData = {
  name_de: "",
  name_tr: "",
  description_de: "",
  description_tr: "",
  category: "",
  price: "",
}

export default function AdminProductForm() {
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /**
   * Lädt das Bild in den Supabase-Bucket "product-images" hoch
   * und gibt die öffentliche URL zurück.
   */
  // Using uploadImage from lib/admin

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      //Bild hochladen
      let image_url: string | null = null
      if (imageFile) {
        image_url = await uploadImage(imageFile)
      }

      const result = await createProduct({
        ...formData,
        price: parseFloat(formData.price),
        image_url,
      })

      if (!result.success) {
        alert("Fehler beim Speichern: " + result.error)
        return
      }

      alert("Produkt erfolgreich hinzugefügt!")

      // Formular zurücksetzen
      setFormData(EMPTY_FORM)
      handleRemoveImage()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,158,102,0.10),_transparent_34%),linear-gradient(180deg,_#0f0d0b_0%,_#12100d_45%,_#0e0c0b_100%)] px-4 py-10 text-stone-100 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9a36c]">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Produkte</h1>
            <p className="mt-2 text-sm text-stone-400">Neue Artikel für das Sortiment anlegen.</p>
          </div>
          <Link href="/change" className="inline-flex min-h-10 items-center rounded-lg border border-[#d9a36c]/60 bg-[#d9a36c] px-4 py-2 text-sm font-bold text-[#24160e] shadow-[0_4px_12px_rgba(120,80,40,0.18)] transition-colors hover:bg-[#e4b37d]">Produkte ändern</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#2c241d] bg-[#181411] shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          imageFile={imageFile}
          imagePreview={imagePreview}
          fileInputRef={fileInputRef}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          handleCategoryChange={(v) => setFormData((p) => ({ ...p, category: v }))}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        </div>
      </div>
    </main>
  )
}