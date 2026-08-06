import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-5 w-16 mt-3" />
      </div>
    </div>
  )
}
