import { useMemo, useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, TrendingDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

export function ExpensesSection() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Insumos');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const totalMonth = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return expenses
      .filter(e => new Date(e.expenseDate) >= cutoff)
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const totalAll = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const resetForm = () => {
    setEditing(null);
    setDescription('');
    setCategory('Insumos');
    setAmount('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setNotes('');
  };

  const handleOpenNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleEdit = (e: Expense) => {
    setEditing(e);
    setDescription(e.description);
    setCategory((EXPENSE_CATEGORIES as readonly string[]).includes(e.category) ? e.category as ExpenseCategory : 'Outros');
    setAmount(e.amount.toString());
    setExpenseDate(e.expenseDate);
    setNotes(e.notes || '');
    setIsOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const value = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(value) || value < 0) {
      toast.error('Preencha descrição e valor válido');
      return;
    }
    const payload = {
      description: description.trim(),
      category,
      amount: value,
      expenseDate,
      notes: notes.trim() || undefined,
    };
    if (editing) {
      await updateExpense(editing.id, payload);
      toast.success('Saída atualizada');
    } else {
      await addExpense(payload);
      toast.success('Saída registrada');
    }
    resetForm();
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast.info('Saída removida');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saídas</h1>
          <p className="text-muted-foreground">Despesas e custos do comércio</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={handleOpenNew}>
              <Plus className="h-5 w-5" /> Nova Saída
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Saída' : 'Nova Saída'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Compra de carnes" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">{editing ? 'Salvar' : 'Registrar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saídas (últimos 30 dias)</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saídas totais</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalAll)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Nenhuma saída registrada</h3>
            <p className="text-muted-foreground mt-1">Clique em "Nova Saída" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico de Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{e.description}</p>
                      <Badge variant="outline">{e.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(e.expenseDate)}
                      {e.notes && ` · ${e.notes}`}
                    </p>
                  </div>
                  <p className="font-bold text-destructive whitespace-nowrap">- {formatCurrency(e.amount)}</p>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover esta saída?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(e.id)}>Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
