"use client"

import { useState, useRef } from "react"
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

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
      // 1. Bild hochladen
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
    <main className="min-h-screen bg-muted/40 py-12 px-4">
      <div className="max-w-2xl mx-auto">
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
    </main>
  )
}