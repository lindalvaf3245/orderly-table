-- Create expenses table for tracking outgoing costs
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete expenses" ON public.expenses FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;