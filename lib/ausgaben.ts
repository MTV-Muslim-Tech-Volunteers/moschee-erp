export interface LocalReceipt {
  tempId: string;
  transaction_date: string;
  amount: number;
  description: string;
  category: string;
}

export interface SavedReceipt {
  id: string;
  transaction_date: string;
  amount: number;
  description: string;
  category: string;
  receipt_number: number;
}

export const CATEGORIES = [
  'Wareneinkauf',
  'Jugendaktivität',
  'Werbung',
  'Instandhaltung',
  'Büromaterial',
  'Reinigung',
  'Vorstand',
  'Sonstiges'
];

export const formatEuro = (val: number) => {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('de-DE');
};
