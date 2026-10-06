import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function formatEuro(value: number) {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

export default function KpiDashboard({
  totalBalance,
  incomeSum,
  expenseSum,
}: {
  totalBalance: number
  incomeSum: number
  expenseSum: number
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardDescription className="font-medium text-foreground/70">Kontostand (Gesamt)</CardDescription>
          <CardTitle className="text-3xl text-primary">{formatEuro(totalBalance)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-medium text-muted-foreground">Gesamteinnahmen</CardDescription>
          <CardTitle className="text-3xl text-emerald-600">{formatEuro(incomeSum)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-medium text-muted-foreground">Gesamtausgaben</CardDescription>
          <CardTitle className="text-3xl text-destructive">-{formatEuro(expenseSum)}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}