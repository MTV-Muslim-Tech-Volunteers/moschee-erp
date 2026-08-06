import React from 'react'
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
  const name = lang === 'de' ? product.name_de : product.name_tr
  const description = lang === 'de' ? product.description_de : product.description_tr

  return (
    <Card className="h-full" onClick={() => router.push(`/menu/${product.id}`)}>
      <div className="relative w-full aspect-[3/2] bg-muted">
        {product.image_url ? (
          <Image src={product.image_url} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">Kein Bild</div>
        )}

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
  )
}
