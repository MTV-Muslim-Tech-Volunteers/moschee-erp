import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  date: string;
  setDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  amountStr: string;
  setAmountStr: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categories: string[];
  onAdd: (e: React.FormEvent) => void;
}

export default function ReceiptForm({
  date,
  setDate,
  description,
  setDescription,
  amountStr,
  setAmountStr,
  category,
  setCategory,
  categories,
  onAdd
}: Props) {
  return (
    <div>
      <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="date">Kaufdatum</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">Buchungstext</Label>
          <Input
            id="description"
            type="text"
            placeholder="z.B. Supermarkt Einkauf"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategorie</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Betrag in €</Label>
          <Input id="amount" type="text" placeholder="0,00" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} required />
        </div>

        <div className="md:col-span-5 flex justify-end mt-2">
          <Button type="submit">Zum Stapel hinzufügen</Button>
        </div>
      </form>
    </div>
  );
}
