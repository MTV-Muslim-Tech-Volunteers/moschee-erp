import { supabase } from './supabase'

export interface ProductFormData {
  name_de: string
  name_tr: string
  description_de: string
  description_tr: string
  category: string
  price: string
}

/** Upload image to Supabase storage 'product-images' and return public URL */
export async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error('Bildupload fehlgeschlagen: ' + uploadError.message)
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
  return data.publicUrl
}
