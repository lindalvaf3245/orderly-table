import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/types/expense';

type DbExpense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
};

const mapExpense = (e: DbExpense): Expense => ({
  id: e.id,
  description: e.description,
  category: e.category,
  amount: Number(e.amount),
  expenseDate: e.expense_date,
  notes: e.notes || undefined,
  createdAt: e.created_at,
});

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    setExpenses((data || []).map(mapExpense));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchExpenses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchExpenses]);

  const addExpense = useCallback(async (input: Omit<Expense, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('expenses').insert({
      description: input.description,
      category: input.category,
      amount: input.amount,
      expense_date: input.expenseDate,
      notes: input.notes || null,
    });
    if (error) console.error(error);
    await fetchExpenses();
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: string, input: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    const payload: Record<string, unknown> = {};
    if (input.description !== undefined) payload.description = input.description;
    if (input.category !== undefined) payload.category = input.category;
    if (input.amount !== undefined) payload.amount = input.amount;
    if (input.expenseDate !== undefined) payload.expense_date = input.expenseDate;
    if (input.notes !== undefined) payload.notes = input.notes || null;
    await supabase.from('expenses').update(payload).eq('id', id);
    await fetchExpenses();
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    await fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
