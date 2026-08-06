import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { LocalReceipt, SavedReceipt } from '@/lib/ausgaben';

interface Props {
  stapel: LocalReceipt[];
  onRemove: (tempId: string) => void;
  onSave: () => void;
  onSort: () => void;
  loading: boolean;
  formatDate: (s: string) => string;
  formatEuro: (n: number) => string;
}

export default function StapelTable({ stapel, onRemove, onSave, onSort, loading, formatDate, formatEuro }: Props) {
  return (
    <div>
      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b bg-muted/50 font-medium text-muted-foreground">
              <th className="p-4">Kaufdatum</th>
              <th className="p-4">Buchungstext</th>
              <th className="p-4">Kategorie</th>
              <th className="p-4 text-right">Betrag</th>
              <th className="p-4 text-center w-20">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stapel.map((item) => (
              <tr key={item.tempId} className="hover:bg-muted/30">
                <td className="p-4">{formatDate(item.transaction_date)}</td>
                <td className="p-4">{item.description}</td>
                <td className="p-4 text-muted-foreground">{item.category}</td>
                <td className="p-4 text-right font-medium text-destructive">-{formatEuro(item.amount)}</td>
                <td className="p-4 text-center">
                  <Button variant="ghost" size="sm" onClick={() => onRemove(item.tempId)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    Löschen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center p-4 bg-muted/20 rounded-md border mt-4">
        <div className="text-sm font-medium">
          Gesamtsumme:{' '}
          <span className="text-foreground ml-2">{formatEuro(stapel.reduce((sum, item) => sum + item.amount, 0))}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSort} disabled={stapel.length === 0}>Chronologisch sortieren</Button>
          <Button onClick={onSave} disabled={loading || stapel.length === 0}>{loading ? 'Speichere...' : 'In Datenbank speichern'}</Button>
        </div>
      </div>
    </div>
  );
}
