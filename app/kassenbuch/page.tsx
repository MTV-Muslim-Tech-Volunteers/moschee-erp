'use client';

import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTransactions } from '@/app/actions/finance';
import KpiDashboard from '@/components/kassenbuch/KpiDashboard';
import TransactionFilters from '@/components/kassenbuch/TransactionFilters';
import TransactionTable from '@/components/kassenbuch/TransactionTable';
import type { Transaction } from '@/components/kassenbuch/types';

export default function KassenbuchUebersichtPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
    async function fetchTransactions() {
      try {
        setLoading(true);
        const result = await getTransactions();

        if (!result.success) throw new Error(result.error);

        const fetched = result.data as Transaction[];
        setTransactions(fetched);

        let income = 0;
        let expense = 0;
        fetched.forEach(t => {
          if (t.is_income) income += t.amount;
          else expense += t.amount;
        });

        setIncomeSum(income);
        setExpenseSum(expense);
        setTotalBalance(income - expense);
      } catch (err: unknown) {
        console.error('Fehler beim Laden der Buchungen:', err);
        setError(err instanceof Error ? err.message : 'Die Buchungen konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
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

    return result;
  }, [searchQuery, selectedYear, selectedType, transactions]);

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

      <KpiDashboard totalBalance={totalBalance} incomeSum={incomeSum} expenseSum={expenseSum} />
      <TransactionFilters searchQuery={searchQuery} selectedYear={selectedYear} selectedType={selectedType} onSearchChange={setSearchQuery} onYearChange={setSelectedYear} onTypeChange={setSelectedType} />
      <TransactionTable transactions={filteredTransactions} totalTransactions={transactions.length} />
    </div>
  );
}