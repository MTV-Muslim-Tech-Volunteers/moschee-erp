import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SavedReceipt } from '@/lib/ausgaben';

interface Props {
  savedReceipts: SavedReceipt[];
  formatDate: (s: string) => string;
  formatEuro: (n: number) => string;
  onReset: () => void;
}

export default function SuccessScreen({ savedReceipts, formatDate, formatEuro, onReset }: Props) {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-primary">Erfolgreich gespeichert</CardTitle>
          <CardDescription className="text-base mt-2 text-foreground/80">
            Wichtiger nächster Schritt: Bitte notiere die unten stehenden Belegnummern mit einem Stift auf deinen physischen Kassenzetteln und hefte sie ab.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zuweisungsliste für Kassenprüfung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/50 font-medium text-muted-foreground">
                  <th className="p-4 w-32">Beleg-Nr.</th>
                  <th className="p-4">Kaufdatum</th>
                  <th className="p-4">Buchungstext</th>
                  <th className="p-4">Kategorie</th>
                  <th className="p-4 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {savedReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <Badge variant="default" className="text-sm font-mono px-2 py-1">#{receipt.receipt_number}</Badge>
                    </td>
                    <td className="p-4">{formatDate(receipt.transaction_date)}</td>
                    <td className="p-4">{receipt.description}</td>
                    <td className="p-4 text-muted-foreground">{receipt.category}</td>
                    <td className="p-4 text-right font-medium text-destructive">-{formatEuro(receipt.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={onReset}>Nächsten Stapel erfassen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
