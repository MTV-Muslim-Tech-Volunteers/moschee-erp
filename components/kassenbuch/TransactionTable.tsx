import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Transaction } from './types'

function formatEuro(value: number) {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('de-DE')
}

export default function TransactionTable({ transactions, totalTransactions }: { transactions: Transaction[]; totalTransactions: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buchungshistorie</CardTitle>
        <CardDescription>Zeigt aktuell {transactions.length} von {totalTransactions} Einträgen.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="whitespace-nowrap border-b bg-muted/50 font-medium text-muted-foreground">
                <th className="w-32 p-4">System-ID</th><th className="w-32 p-4">Alt-Beleg</th><th className="w-32 p-4">Kaufdatum</th><th className="p-4">Buchungstext</th><th className="p-4">Kategorie</th><th className="p-4 text-center">Art</th><th className="p-4 text-right">Betrag</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Keine Buchungen für die gewählten Filterkriterien gefunden.</td></tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs text-muted-foreground">#{transaction.receipt_number}</td>
                  <td className="p-4">{transaction.legacy_receipt_number ? <Badge variant="outline" className="border-primary/30 bg-background font-mono text-primary">{transaction.legacy_receipt_number}</Badge> : <span className="text-xs text-muted-foreground">-</span>}</td>
                  <td className="p-4 tabular-nums">{formatDate(transaction.transaction_date)}</td>
                  <td className="p-4 font-medium text-foreground">{transaction.description}</td>
                  <td className="p-4 text-muted-foreground">{transaction.category}</td>
                  <td className="p-4 text-center">{transaction.is_income ? <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Einnahme</Badge> : <Badge variant="secondary" className="bg-slate-200 text-slate-800 hover:bg-slate-300">Ausgabe</Badge>}</td>
                  <td className={`p-4 text-right font-medium tabular-nums ${transaction.is_income ? 'text-emerald-600' : 'text-foreground'}`}>{transaction.is_income ? '+' : '-'}{formatEuro(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}