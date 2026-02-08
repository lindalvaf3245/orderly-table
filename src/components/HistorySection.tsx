import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { History, TrendingUp, Calendar, DollarSign, Banknote, CreditCard, Trash2 } from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '@/types/restaurant';
import { PixIcon } from '@/components/icons/PixIcon';

export function HistorySection() {
  const { orderHistory, getTodayTotal, deleteFromHistory } = useOrders();
  const todayTotal = getTodayTotal();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-success/15 text-success hover:bg-success/20 border-0">
            Pago
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-0">
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/30">
            Em Aberto
          </Badge>
        );
    }
  };

  const getPaymentMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'pix':
        return <PixIcon size={16} />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'Espécie';
      case 'pix':
        return 'Pix';
      case 'card':
        return 'Cartão';
      default:
        return '';
    }
  };

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
    if (orderToDelete) {
      deleteFromHistory(orderToDelete.id);
    }
    setConfirmDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setConfirmDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  // Group orders by date
  const groupedOrders = orderHistory.reduce<Record<string, Order[]>>((acc, order) => {
    const date = new Date(order.closedAt || order.openedAt).toLocaleDateString('pt-BR');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(order);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'));
    const dateB = new Date(b.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  const getDayTotal = (orders: Order[]) => {
    return orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
  };

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
              <p className="text-sm font-medium text-muted-foreground">
                Vendas de Hoje
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(todayTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {orderHistory.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Nenhuma venda registrada</h3>
            <p className="text-muted-foreground mt-1">
              As comandas finalizadas aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const orders = groupedOrders[date];
            const dayTotal = getDayTotal(orders);
            const isToday = date === new Date().toLocaleDateString('pt-BR');

            return (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">
                      {isToday ? 'Hoje' : date}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">{formatCurrency(dayTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {orders.map((order) => {
                    const { time } = formatDateTime(order.closedAt || order.openedAt);
                    return (
                      <Card key={order.id} className="hover:shadow-sm transition-shadow group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{order.name}</h4>
                                {getStatusBadge(order.status)}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{time} • {order.items.filter(i => !i.cancelled).length} item(ns)</span>
                                {order.status === 'paid' && order.paymentMethod && (
                                  <span className="flex items-center gap-1 text-success">
                                    {getPaymentMethodIcon(order.paymentMethod)}
                                    <span className="text-xs">{getPaymentMethodLabel(order.paymentMethod)}</span>
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleDeleteClick(order, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${
                                  order.status === 'paid' ? 'text-success' : 
                                  order.status === 'cancelled' ? 'text-muted-foreground line-through' : 
                                  'text-foreground'
                                }`}>
                                  {formatCurrency(order.total)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
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
            <AlertDialogAction 
              onClick={handleFirstConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
            <AlertDialogAction 
              onClick={handleFinalConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
