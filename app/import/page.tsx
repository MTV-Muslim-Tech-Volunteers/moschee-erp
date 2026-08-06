'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CsvImportPage() {
  const [status, setStatus] = useState<string>('Warte auf Datei...');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('Lese CSV-Datei aus...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const rawData = results.data as any[];
        const formattedData = [];

        for (const row of rawData) {
          if (!row.Datum) continue;

          // Spezialfall: Startguthaben (Zeile 1)
          if (!row.Betrag && row.Bestand) {
            const startAmount = parseFloat(row.Bestand.replace('.', '').replace(',', '.'));
            formattedData.push({
              transaction_date: row.Datum.split('.').reverse().join('-'), // "01.01.2025" -> "2025-01-01"
              amount: startAmount,
              is_income: true,
              legacy_receipt_number: 'Start',
              description: 'Startguthaben 2025',
              category: 'System',
            });
            continue;
          }

          // Überspringe ungültige Zeilen ohne Betrag
          if (!row.Betrag) continue;

          // Betrag formatieren ("35,25" -> 35.25)
          const amountStr = row.Betrag.replace('.', '').replace(',', '.');
          const amount = parseFloat(amountStr);

          // Datum formatieren
          const dateParts = row.Datum.split('.');
          const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

          formattedData.push({
            transaction_date: isoDate,
            amount: amount,
            is_income: row['S/H'] === 'S',
            legacy_receipt_number: row.Belegfeld || null,
            description: row.Buchungstext || 'Keine Beschreibung',
            category: row.Kategorie || 'Sonstiges',
          });
        }

        setStatus(`CSV verarbeitet. Sende ${formattedData.length} Einträge an Supabase...`);

        // Batch Insert in Supabase
        const { error } = await supabase
          .from('transactions')
          .insert(formattedData);

        if (error) {
          console.error(error);
          setStatus(`Fehler beim Import: ${error.message}`);
        } else {
          setStatus(`Erfolg! Alle ${formattedData.length} Buchungen wurden importiert.`);
        }
        
        setLoading(false);
      },
    });
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Einmaliger Kassenbuch-Import</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <label className="block mb-4 text-sm font-medium text-gray-700">
          Lade die Kassenbuch.csv hoch
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <div className="mt-6 p-4 rounded-md bg-gray-50 text-gray-800">
          <strong>Status:</strong> {status}
        </div>
      </div>
    </div>
  );
}