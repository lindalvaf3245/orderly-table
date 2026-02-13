import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { History, TrendingUp, Calendar, DollarSign, Banknote, CreditCard, Trash2, ChevronDown, Printer } from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '@/types/restaurant';
import { PixIcon } from '@/components/icons/PixIcon';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-success/15 text-success hover:bg-success/20 border-0">Pago</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-0">Cancelado</Badge>;
    default:
      return <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/30">Em Aberto</Badge>;
  }
};

const getPaymentMethodIcon = (method?: PaymentMethod) => {
  switch (method) {
    case 'cash': return <Banknote className="h-4 w-4" />;
    case 'pix': return <PixIcon size={16} />;
    case 'card': return <CreditCard className="h-4 w-4" />;
    default: return null;
  }
};

const getPaymentMethodLabel = (method?: PaymentMethod) => {
  switch (method) {
    case 'cash': return 'Espécie';
    case 'pix': return 'Pix';
    case 'card': return 'Cartão';
    default: return '';
  }
};

function OrderCard({ order, onDelete }: { order: Order; onDelete: (order: Order, e: React.MouseEvent) => void }) {
  const [open, setOpen] = useState(false);
  const { time } = formatDateTime(order.closedAt || order.openedAt);
  const activeItems = order.items.filter(i => !i.cancelled);

  // Stack items
  const stackedItems = activeItems.reduce<{ productName: string; quantity: number; unitPrice: number; total: number }[]>((acc, item) => {
    const existing = acc.find(a => a.productName === item.productName && a.unitPrice === item.unitPrice);
    if (existing) {
      existing.quantity += item.quantity;
      existing.total += item.total;
    } else {
      acc.push({ productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total });
    }
    return acc;
  }, []);

  const partialPayments = order.partialPayments || [];
  const totalPartial = partialPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, order.total - totalPartial);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="transition-shadow">
        <CardContent className="p-0">
          <CollapsibleTrigger className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{order.name}</h4>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {time} • {activeItems.length} item(ns)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); onDelete(order, e); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <p className={`text-lg font-bold ${
                order.status === 'paid' ? 'text-success' :
                order.status === 'cancelled' ? 'text-muted-foreground line-through' :
                'text-foreground'
              }`}>
                {formatCurrency(order.total)}
              </p>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3">
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Itens consumidos:</p>
                {stackedItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum item</p>
                ) : (
                  <div className="space-y-0.5">
                    {stackedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.productName}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments */}
              {order.status === 'paid' && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Pagamentos:</p>
                  {partialPayments.length > 0 ? (
                    <div className="space-y-0.5">
                      {partialPayments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5">
                            {getPaymentMethodIcon(p.method)}
                            <span>{getPaymentMethodLabel(p.method)}</span>
                          </span>
                          <span className="font-medium">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      {order.paymentMethod && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5">
                            {getPaymentMethodIcon(order.paymentMethod)}
                            <span>{getPaymentMethodLabel(order.paymentMethod)} (final)</span>
                          </span>
                          <span className="font-medium">{formatCurrency(remaining)}</span>
                        </div>
                      )}
                    </div>
                  ) : order.paymentMethod ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-border/50 pt-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                {partialPayments.length > 0 && (
                  <div className="flex justify-between text-sm font-bold text-success">
                    <span>Total a Pagar</span>
                    <span>{formatCurrency(remaining)}</span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export function HistorySection() {
  const { orderHistory, getTodayTotal, deleteFromHistory } = useOrders();
  const todayTotal = getTodayTotal();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const handleDeleteClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleFirstConfirm = () => {
    setDeleteDialogOpen(false);
    setConfirmDeleteDialogOpen(true);
  };

  const handleFinalConfirm = () => {
    if (orderToDelete) deleteFromHistory(orderToDelete.id);
    setConfirmDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setConfirmDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleDayConference = (date: string, orders: Order[]) => {
    // Encode data in URL params
    const data = encodeURIComponent(JSON.stringify({ date, orders }));
    window.open(`/conferencia-dia?data=${data}`, '_blank');
  };

  // Group orders by date
  const groupedOrders = orderHistory.reduce<Record<string, Order[]>>((acc, order) => {
    const date = new Date(order.closedAt || order.openedAt).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(order);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'));
    const dateB = new Date(b.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  const getDayTotal = (orders: Order[]) =>
    orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground">
            {orderHistory.length} venda{orderHistory.length !== 1 ? 's' : ''} registrada{orderHistory.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Today's Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vendas de Hoje</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(todayTotal)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {orderHistory.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Nenhuma venda registrada</h3>
            <p className="text-muted-foreground mt-1">As comandas finalizadas aparecerão aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const orders = groupedOrders[date];
            const dayTotal = getDayTotal(orders);
            const isToday = date === new Date().toLocaleDateString('pt-BR');

            return (
              <Collapsible key={date} defaultOpen={isToday}>
                <Card>
                  <CollapsibleTrigger className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{isToday ? 'Hoje' : date}</h3>
                      <Badge variant="outline" className="text-xs">{orders.length} venda{orders.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(dayTotal)}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 mb-2"
                        onClick={() => handleDayConference(date, orders)}
                      >
                        <Printer className="h-4 w-4" />
                        Conferência do Dia
                      </Button>
                      {orders.map((order) => (
                        <OrderCard key={order.id} order={order} onDelete={handleDeleteClick} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* First Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a apagar o registro de "{orderToDelete?.name}".
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Confirmation Dialog */}
      <AlertDialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é a última confirmação. O registro de "{orderToDelete?.name}" no valor de{' '}
              {orderToDelete && formatCurrency(orderToDelete.total)} será permanentemente apagado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
