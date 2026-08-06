"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import ReceiptForm from '@/components/ausgaben/ReceiptForm';
import StapelTable from '@/components/ausgaben/StapelTable';
import SuccessScreen from '@/components/ausgaben/SuccessScreen';
import { LocalReceipt, SavedReceipt, CATEGORIES, formatEuro, formatDate } from '@/lib/ausgaben';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AusgabenStapelPage() {
  const [stapel, setStapel] = useState<LocalReceipt[]>([]);
  const [date, setDate] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[] | null>(null);

  const handleAddToStapel = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !amountStr || !description.trim()) {
      setError('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Bitte einen gültigen Betrag eingeben.');
      return;
    }

    const newReceipt: LocalReceipt = {
      tempId: Math.random().toString(36).substring(2, 9),
      transaction_date: date,
      amount: parsedAmount,
      description: description.trim(),
      category: category
    };

    setStapel((s) => [...s, newReceipt]);
    setAmountStr('');
    setDescription('');
  };

  const sortChronologically = () => {
    setStapel((s) => [...s].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()));
  };

  const handleRemoveFromStapel = (tempId: string) => {
    setStapel((s) => s.filter(item => item.tempId !== tempId));
  };

  const handleSaveToDatabase = async () => {
    if (stapel.length === 0) return;

    setLoading(true);
    setError(null);

    const dbPayload = stapel.map(({ transaction_date, amount, description, category }) => ({
      transaction_date,
      amount,
      description,
      category,
      is_income: false
    }));

    try {
      const { data, error: dbError } = await supabase
        .from('transactions')
        .insert(dbPayload)
        .select();

      if (dbError) throw dbError;

      const sortedResult = (data as SavedReceipt[]).sort((a, b) => a.receipt_number - b.receipt_number);
      setSavedReceipts(sortedResult);
      setStapel([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (savedReceipts) {
    return <SuccessScreen savedReceipts={savedReceipts} formatDate={formatDate} formatEuro={formatEuro} onReset={() => setSavedReceipts(null)} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stapelverarbeitung Ausgaben</h1>
        <p className="text-sm text-muted-foreground mt-1">Erfasse Belege lokal, sortiere sie chronologisch und buche sie gesammelt in die Datenbank.</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm font-medium border border-destructive/20">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Neuen Bon erfassen</CardTitle>
          <CardDescription>Daten werden vorerst nur im Arbeitsspeicher gehalten.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReceiptForm
            date={date}
            setDate={setDate}
            description={description}
            setDescription={setDescription}
            amountStr={amountStr}
            setAmountStr={setAmountStr}
            category={category}
            setCategory={setCategory}
            categories={CATEGORIES}
            onAdd={handleAddToStapel}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Aktueller Sitzungs-Stapel</CardTitle>
            <CardDescription>{stapel.length} Belege geladen</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {stapel.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground border rounded-md border-dashed">Der Stapel ist aktuell leer.</div>
          ) : (
            <StapelTable stapel={stapel} onRemove={handleRemoveFromStapel} onSave={handleSaveToDatabase} onSort={sortChronologically} loading={loading} formatDate={formatDate} formatEuro={formatEuro} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}