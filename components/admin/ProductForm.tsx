import React from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductFormData } from '@/lib/admin'

export default function ProductForm({
  formData,
  setFormData,
  imageFile,
  imagePreview,
  fileInputRef,
  handleImageChange,
  handleRemoveImage,
  handleCategoryChange,
  handleSubmit,
  isSubmitting,
}: {
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
  imageFile: File | null
  imagePreview: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveImage: () => void
  handleCategoryChange: (v: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Neues Produkt hinzufügen</CardTitle>
        <CardDescription>Füllen Sie alle Felder aus, um ein neues Produkt anzulegen.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Produktname</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name_de" className="text-sm font-medium text-foreground">Name (Deutsch)</label>
                <Input id="name_de" name="name_de" value={formData.name_de} onChange={handleChange} placeholder="z.B. Pommes" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="name_tr" className="text-sm font-medium text-foreground">Name (Türkisch)</label>
                <Input id="name_tr" name="name_tr" value={formData.name_tr} onChange={handleChange} placeholder="örn. Patates Kızartması" required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Beschreibung</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="description_de" className="text-sm font-medium text-foreground">Beschreibung (Deutsch)</label>
                <Textarea id="description_de" name="description_de" value={formData.description_de} onChange={handleChange} placeholder="Aussagekräftige Produktbeschreibung auf Deutsch eingeben..." rows={3} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="description_tr" className="text-sm font-medium text-foreground">Beschreibung (Türkisch)</label>
                <Textarea id="description_tr" name="description_tr" value={formData.description_tr} onChange={handleChange} placeholder="Bilgilendirici ürün açıklamasını Türkçe girin..." rows={3} required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Produktbild</h3>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                  <Image src={imagePreview} alt="Vorschau" fill className="object-contain" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded hover:opacity-90 transition-opacity">Entfernen</button>
                </div>
              ) : (
                <label htmlFor="image" className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm font-medium">Bild auswählen</span>
                    <span className="text-xs">PNG, JPG, WEBP bis 5 MB</span>
                  </div>
                </label>
              )}

              <input ref={fileInputRef} id="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
              {imageFile && (<p className="text-xs text-muted-foreground">Ausgewählt: <span className="font-medium">{imageFile.name}</span></p>)}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-foreground">Kategorie</label>
                <Select value={formData.category} onValueChange={handleCategoryChange} required>
                  <SelectTrigger id="category"><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hauptspeise">Hauptspeise</SelectItem>
                    <SelectItem value="Getränk">Getränk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium text-foreground">Preis (€)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} placeholder="0.00" className="pl-8" required />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-32">{isSubmitting ? 'Speichern...' : 'Produkt hinzufügen'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
