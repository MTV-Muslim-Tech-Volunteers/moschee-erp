import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TransactionFilters({
  searchQuery,
  selectedYear,
  selectedType,
  onSearchChange,
  onYearChange,
  onTypeChange,
}: {
  searchQuery: string
  selectedYear: string
  selectedType: string
  onSearchChange: (value: string) => void
  onYearChange: (value: string) => void
  onTypeChange: (value: string) => void
}) {
  return (
    <Card className="bg-muted/10">
      <CardContent className="grid grid-cols-1 items-end gap-4 p-4 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Input type="text" placeholder="Suche nach Beschreibung, Kategorie oder Belegnummer..." value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <select value={selectedYear} onChange={(event) => onYearChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="ALL">Alle Jahre</option>
            <option value="2026">2026</option>
            <option value="2025">2025 (Importiert)</option>
          </select>
        </div>
        <div className="space-y-2">
          <select value={selectedType} onChange={(event) => onTypeChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="ALL">Alle Buchungsarten</option>
            <option value="INCOME">Nur Einnahmen</option>
            <option value="EXPENSE">Nur Ausgaben</option>
          </select>
        </div>
      </CardContent>
    </Card>
  )
}