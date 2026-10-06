import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import type { Product } from '@/lib/menu'

type Language = 'de' | 'tr'

export default function ProductCard({
  product,
  lang,
  onAdd,
  cartQty,
}: {
  product: Product
  lang: Language
  onAdd: (p: Product) => void
  cartQty: number
}) {
  const router = useRouter()
  const [imageFailed, setImageFailed] = useState(false)
  const name = lang === 'de' ? product.name_de : product.name_tr
  const description = lang === 'de' ? product.description_de : product.description_tr

  return (
    <div className="group relative h-full rounded-xl bg-[linear-gradient(135deg,#d9dde1,#94a3b8_45%,#e5e7eb_70%,#9ca3af)] p-[2px] shadow-[0_4px_12px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,0.22)]">
      <Card className="h-full overflow-hidden rounded-[10px] border-0 bg-card shadow-none" onClick={() => router.push(`/menu/${product.id}`)}>
      <div className="relative w-full aspect-[3/2] border-b border-slate-400/60 bg-muted p-1.5">
        <div className="relative h-full w-full overflow-hidden rounded-md border border-slate-300/80 bg-slate-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.25)]">
          {product.image_url && !imageFailed ? (
            <Image src={product.image_url} alt={name} fill className="object-cover" onError={() => setImageFailed(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">Kein Bild</div>
          )}
        </div>

        {cartQty > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg">
            {cartQty}
          </div>
        )}

        {!product.is_available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive" className="text-[10px]">{lang === 'de' ? 'Nicht verfügbar' : 'Mevcut değil'}</Badge>
          </div>
        )}
      </div>

      <CardHeader className="flex-1">
        <CardTitle className="break-words">{name}</CardTitle>
        {description && (
          <CardDescription className="overflow-hidden text-ellipsis line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="justify-between gap-1">
        <span className="text-xs font-bold text-foreground whitespace-nowrap">{product.price.toFixed(2).replace('.', ',')} €</span>
        <button
          disabled={!product.is_available}
          onClick={(e) => { e.stopPropagation(); onAdd(product) }}
          className="flex items-center px-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold whitespace-nowrap transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40 shadow-sm"
        >
          {lang === 'de' ? 'Hinzufügen' : 'Ekle'}
        </button>
      </CardFooter>
      </Card>
    </div>
  )
}
