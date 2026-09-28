import React from 'react'

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
}

export default function InventoryPanel({
  inventory,
  onStockChange
}: {
  inventory: InventoryItem[];
  onStockChange: (id: string, currentStock: number, delta: number) => void;
}) {
  if (!inventory || inventory.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#2c241d] bg-[#181411] shadow-sm overflow-hidden">
      <div className="border-b border-[#2c241d] px-5 py-3.5">
        <span className="text-base font-semibold text-stone-100">Lagerbestand Zutaten (Packungen)</span>
      </div>
      <div className="flex justify-center gap-3 overflow-x-auto px-4 py-4">
        {inventory.map((item) => (
          <div key={item.id} className="w-[11.25rem] shrink-0 rounded-xl border border-[#2f261f] bg-[#1b1612] p-3">
            <div className="mb-2 flex min-h-[2.5rem] items-center justify-between gap-3 text-left">
              <span className="min-w-0 flex-1 text-sm font-medium leading-tight text-stone-100">{item.name}</span>
              <span className="ml-1 shrink-0 rounded-md bg-[#2b221c] px-2 py-1 text-xs font-bold text-stone-100">{item.stock}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => onStockChange(item.id, item.stock, -1)}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2b221c] font-bold transition-colors hover:bg-destructive hover:text-destructive-foreground"
                type="button"
              >
                -
              </button>
              <button
                onClick={() => onStockChange(item.id, item.stock, 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2b221c] font-bold transition-colors hover:bg-[#d9a36c] hover:text-[#20150d]"
                type="button"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}