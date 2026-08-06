'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Transaction {
  id: string;
  transaction_date: string;
  amount: number;
  is_income: boolean;
  receipt_number: number;
  legacy_receipt_number?: string | null;
  description: string;
  category: string;
}

export default function KassenbuchUebersichtPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter-States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Kennzahlen
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [incomeSum, setIncomeSum] = useState<number>(0);
  const [expenseSum, setExpenseSum] = useState<number>(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedYear, selectedType, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('receipt_number', { ascending: false });

      if (dbError) throw dbError;

      const fetched = data as Transaction[];
      setTransactions(fetched);

      // Berechnungen für das gesamte System
      let income = 0;
      let expense = 0;
      fetched.forEach(t => {
        if (t.is_income) income += t.amount;
        else expense += t.amount;
      });

      setIncomeSum(income);
      setExpenseSum(expense);
      setTotalBalance(income - expense);
    } catch (err: any) {
      console.error('Fehler beim Laden der Buchungen:', err);
      setError(err.message || 'Die Buchungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...transactions];

    // 1. Suchbegriff (Beschreibung, Kategorie oder Belegnummer)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.receipt_number.toString().includes(query) ||
        (t.legacy_receipt_number && t.legacy_receipt_number.toLowerCase().includes(query))
      );
    }

    // 2. Filter nach Jahr
    if (selectedYear !== 'ALL') {
      result = result.filter(t => {
        const year = new Date(t.transaction_date).getFullYear().toString();
        return year === selectedYear;
      });
    }

    // 3. Filter nach Typ (Einnahme/Ausgabe)
    if (selectedType !== 'ALL') {
      const targetIncome = selectedType === 'INCOME';
      result = result.filter(t => t.is_income === targetIncome);
    }

    setFilteredTransactions(result);
  };

  const formatEuro = (val: number) => {
    return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full mt-6" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kassenbuch</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historie und Filter aller importierten und neu erfassten Geschäftsfälle.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
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

      {/* Filter-Leiste */}
      <Card className="bg-muted/10">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 sm:col-span-2">
            <Input
              type="text"
              placeholder="Suche nach Beschreibung, Kategorie oder Belegnummer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Alle Jahre</option>
              <option value="2026">2026</option>
              <option value="2025">2025 (Importiert)</option>
            </select>
          </div>

          <div className="space-y-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Alle Buchungsarten</option>
              <option value="INCOME">Nur Einnahmen</option>
              <option value="EXPENSE">Nur Ausgaben</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Buchungshistorie</CardTitle>
          <CardDescription>
            Zeigt aktuell {filteredTransactions.length} von {transactions.length} Einträgen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/50 font-medium text-muted-foreground whitespace-nowrap">
                  <th className="p-4 w-32">System-ID</th>
                  <th className="p-4 w-32">Alt-Beleg</th>
                  <th className="p-4 w-32">Kaufdatum</th>
                  <th className="p-4">Buchungstext</th>
                  <th className="p-4">Kategorie</th>
                  <th className="p-4 text-center">Art</th>
                  <th className="p-4 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Keine Buchungen für die gewählten Filterkriterien gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/30">
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        #{transaction.receipt_number}
                      </td>
                      <td className="p-4">
                        {transaction.legacy_receipt_number ? (
                          <Badge variant="outline" className="font-mono bg-background text-primary border-primary/30">
                            {transaction.legacy_receipt_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 tabular-nums">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="p-4 font-medium text-foreground">
                        {transaction.description}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {transaction.category}
                      </td>
                      <td className="p-4 text-center">
                        {transaction.is_income ? (
                          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                            Einnahme
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-200 text-slate-800 hover:bg-slate-300">
                            Ausgabe
                          </Badge>
                        )}
                      </td>
                      <td className={`p-4 text-right font-medium tabular-nums ${
                        transaction.is_income ? 'text-emerald-600' : 'text-foreground'
                      }`}>
                        {transaction.is_income ? '+' : '-'}{formatEuro(transaction.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}