export interface Transaction {
  id: string
  transaction_date: string
  amount: number
  is_income: boolean
  receipt_number: number
  legacy_receipt_number?: string | null
  description: string
  category: string
}