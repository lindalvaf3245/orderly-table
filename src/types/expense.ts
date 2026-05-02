export const EXPENSE_CATEGORIES = [
  'Insumos',
  'Salários',
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Manutenção',
  'Impostos',
  'Outros',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory | string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}
