import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  X,
  DollarSign,
  Clock,
  ShoppingBag,
  Trash2,
  RotateCcw,
  BookCheck,
  Banknote,
  CreditCard,
  Copy,
  SplitSquareHorizontal,
} from 'lucide-react';
import { PixIcon } from '@/components/icons/PixIcon';
import { Combobox } from '@/components/ui/combobox';
import { Order, PaymentMethod } from '@/types/restaurant';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OrdersSection() {
  const {
    openOrders, createOrder, addItemToOrder, cancelItem, removeItem,
    cancelOrder, payOrder, addPartialPayment, removePartialPayment, getOrderRemainingBalance,
  } = useOrders();
  const { products } = useProducts();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);

  // Cancel quantity dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetItem, setCancelTargetItem] = useState<{ orderId: string; itemId: string; maxQty: number } | null>(null);
  const [cancelQuantity, setCancelQuantity] = useState('');

  // Partial payment state
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialPaymentMethod, setPartialPaymentMethod] = useState<PaymentMethod | null>(null);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderName.trim()) {
      toast.error('Digite um nome para a comanda');
      return;
    }
    createOrder(newOrderName);
    toast.success(`Comanda "${newOrderName}" aberta!`);
    setNewOrderName('');
    setIsNewOrderOpen(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedProductId) {
      toast.error('Selecione um produto');
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    const qty = parseInt(itemQuantity) || 1;
    addItemToOrder(selectedOrder.id, product.id, product.name, qty, product.price);
    toast.success(`${qty}x ${product.name} adicionado!`);
    setSelectedProductId('');
    setItemQuantity('1');
    setIsAddItemOpen(false);
  };

  const handleCancelItemClick = (orderId: string, itemId: string, quantity: number) => {
    if (quantity > 1) {
      setCancelTargetItem({ orderId, itemId, maxQty: quantity });
      setCancelQuantity(quantity.toString());
      setCancelDialogOpen(true);
    } else {
      cancelItem(orderId, itemId);
      toast.info('Item cancelado');
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelTargetItem) return;
    const qty = parseInt(cancelQuantity) || cancelTargetItem.maxQty;
    const clampedQty = Math.min(Math.max(1, qty), cancelTargetItem.maxQty);
    cancelItem(cancelTargetItem.orderId, cancelTargetItem.itemId, clampedQty);
    toast.info(`${clampedQty} item(ns) cancelado(s)`);
    setCancelDialogOpen(false);
    setCancelTargetItem(null);
  };

  const handleRemoveItem = (orderId: string, itemId: string) => {
    removeItem(orderId, itemId);
    toast.info('Item removido');
  };

  const handlePayOrder = (orderId: string, paymentMethod: PaymentMethod) => {
    payOrder(orderId, paymentMethod);
    setSelectedOrder(null);
    setIsPaymentMethodOpen(false);
    const methodLabels: Record<PaymentMethod, string> = {
      cash: 'Espécie', pix: 'Pix', card: 'Cartão',
    };
    toast.success(`Pagamento via ${methodLabels[paymentMethod]} registrado!`);
  };

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
    setSelectedOrder(null);
    toast.info('Comanda cancelada');
  };

  const handleRepeatItem = (productId: string, quantity: number) => {
    setSelectedProductId(productId);
    setItemQuantity(quantity.toString());
    setIsAddItemOpen(true);
  };

  const handleAddPartialPayment = () => {
    if (!currentSelectedOrder || !partialPaymentMethod) return;
    const amount = parseFloat(partialAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }
    const remaining = getOrderRemainingBalance(currentSelectedOrder);
    if (amount > remaining) {
      toast.error(`Valor excede o saldo restante de ${formatCurrency(remaining)}`);
      return;
    }
    addPartialPayment(currentSelectedOrder.id, amount, partialPaymentMethod);
    const methodLabels: Record<PaymentMethod, string> = {
      cash: 'Espécie', pix: 'Pix', card: 'Cartão',
    };
    toast.success(`Pagamento parcial de ${formatCurrency(amount)} via ${methodLabels[partialPaymentMethod]}`);
    setPartialAmount('');
    setPartialPaymentMethod(null);
    setIsPartialPaymentOpen(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleOpenReceipt = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/conferencia/${orderId}`, '_blank');
  };

  const currentSelectedOrder = selectedOrder
    ? openOrders.find((o) => o.id === selectedOrder.id) || null
    : null;

  const remainingBalance = currentSelectedOrder ? getOrderRemainingBalance(currentSelectedOrder) : 0;
  const totalPaid = currentSelectedOrder
    ? (currentSelectedOrder.partialPayments || []).reduce((s, p) => s + p.amount, 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comandas</h1>
          <p className="text-muted-foreground">
            {openOrders.length} comanda{openOrders.length !== 1 ? 's' : ''} aberta{openOrders.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 touch-action-manipulation">
              <Plus className="h-5 w-5" />
              Nova Comanda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Abrir Nova Comanda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderName">Nome da mesa/cliente</Label>
                <Input
                  id="orderName"
                  value={newOrderName}
                  onChange={(e) => setNewOrderName(e.target.value)}
                  placeholder="Ex: Mesa 01, João, Família Silva"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsNewOrderOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">Abrir Comanda</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {openOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Nenhuma comanda aberta</h3>
            <p className="text-muted-foreground mt-1">Clique em "Nova Comanda" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openOrders.map((order) => {
            const orderPaid = (order.partialPayments || []).reduce((s, p) => s + p.amount, 0);
            return (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => setSelectedOrder(order)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{order.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleOpenReceipt(order.id, e)} title="Ver Conferência">
                        <BookCheck className="h-4 w-4" />
                      </Button>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.openedAt)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {order.items.filter((i) => !i.cancelled).length} item(ns)
                  </p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(order.total)}</p>
                  {orderPaid > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago: {formatCurrency(orderPaid)} · Resta: {formatCurrency(order.total - orderPaid)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!currentSelectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {currentSelectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-xl">{currentSelectedOrder.name}</DialogTitle>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(currentSelectedOrder.openedAt)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Add Item Button */}
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2" size="lg">
                      <Plus className="h-5 w-5" />
                      Adicionar Consumo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Consumo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Produto</Label>
                        <Combobox
                          options={products.map((product) => ({
                            label: `${product.name} - ${formatCurrency(product.price)}`,
                            value: product.id,
                          }))}
                          value={selectedProductId}
                          onChange={setSelectedProductId}
                          placeholder="Selecione um produto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input id="quantity" type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddItemOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="flex-1">Adicionar</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Itens</h4>
                  {currentSelectedOrder.items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum item adicionado</p>
                  ) : (
                    <TooltipProvider>
                      <div className="space-y-2">
                        {currentSelectedOrder.items.map((item) => (
                          <div
                            key={item.id}
                            className={`group flex items-center justify-between p-3 rounded-lg border ${
                              item.cancelled ? 'bg-muted/50 opacity-60' : 'bg-card'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${item.cancelled ? 'line-through' : ''}`}>
                                {item.quantity}x {item.productName}
                              </p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)} cada</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${item.cancelled ? 'line-through' : ''}`}>
                                {formatCurrency(item.total)}
                              </span>
                              {!item.cancelled && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon" variant="ghost"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleRepeatItem(item.productId, item.quantity)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Repetir pedido</p></TooltipContent>
                                </Tooltip>
                              )}
                              {!item.cancelled ? (
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleCancelItemClick(currentSelectedOrder.id, item.id, item.quantity)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="icon" variant="ghost" className="h-8 w-8"
                                  onClick={() => handleRemoveItem(currentSelectedOrder.id, item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TooltipProvider>
                  )}
                </div>

                <Separator />

                {/* Partial Payments */}
                {(currentSelectedOrder.partialPayments || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pagamentos Parciais</h4>
                    {(currentSelectedOrder.partialPayments || []).map((payment) => {
                      const methodLabels: Record<PaymentMethod, string> = { cash: 'Espécie', pix: 'Pix', card: 'Cartão' };
                      return (
                        <div key={payment.id} className="group flex items-center justify-between p-2 rounded-lg border bg-card">
                          <div>
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            <span className="text-sm text-muted-foreground ml-2">via {methodLabels[payment.method]}</span>
                          </div>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              removePartialPayment(currentSelectedOrder.id, payment.id);
                              toast.info('Pagamento parcial removido');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                    <Separator />
                  </div>
                )}

                {/* Total */}
                <div className="space-y-1 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(currentSelectedOrder.total)}</span>
                  </div>
                  {totalPaid > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Pago</span>
                        <span>{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span>Restante</span>
                        <span className="text-primary">{formatCurrency(remainingBalance)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="lg" className="gap-1 text-destructive hover:text-destructive text-sm">
                        <RotateCcw className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar comanda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A comanda "{currentSelectedOrder.name}" será cancelada e movida para o histórico.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelOrder(currentSelectedOrder.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancelar Comanda
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Partial Payment Button */}
                  <Dialog open={isPartialPaymentOpen} onOpenChange={setIsPartialPaymentOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg" className="gap-1 text-sm" disabled={remainingBalance === 0}>
                        <SplitSquareHorizontal className="h-4 w-4" />
                        Dividir
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Pagamento Parcial</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Restante: <span className="font-bold text-foreground">{formatCurrency(remainingBalance)}</span>
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="partialAmount">Valor a pagar</Label>
                          <Input
                            id="partialAmount"
                            type="text"
                            inputMode="decimal"
                            value={partialAmount}
                            onChange={(e) => setPartialAmount(e.target.value)}
                            placeholder="Ex: 50,00"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Forma de pagamento</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              { method: 'cash' as PaymentMethod, label: 'Espécie', icon: <Banknote className="h-6 w-6" /> },
                              { method: 'pix' as PaymentMethod, label: 'Pix', icon: <PixIcon size={24} /> },
                              { method: 'card' as PaymentMethod, label: 'Cartão', icon: <CreditCard className="h-6 w-6" /> },
                            ]).map(({ method, label, icon }) => (
                              <Button
                                key={method}
                                type="button"
                                variant={partialPaymentMethod === method ? 'default' : 'outline'}
                                className="flex flex-col items-center gap-1 h-20"
                                onClick={() => setPartialPaymentMethod(method)}
                              >
                                {icon}
                                <span className="text-xs">{label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          disabled={!partialPaymentMethod || !partialAmount}
                          onClick={handleAddPartialPayment}
                        >
                          Confirmar Pagamento
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Full Payment Button */}
                  <Dialog open={isPaymentMethodOpen} onOpenChange={setIsPaymentMethodOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="gap-1 bg-success hover:bg-success/90 text-sm" disabled={remainingBalance === 0}>
                        <DollarSign className="h-4 w-4" />
                        Pagar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Forma de Pagamento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          {totalPaid > 0 ? 'Restante' : 'Total'}:{' '}
                          <span className="font-bold text-foreground">{formatCurrency(remainingBalance)}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-24 hover:border-primary hover:bg-primary/5"
                            onClick={() => handlePayOrder(currentSelectedOrder.id, 'cash')}
                          >
                            <Banknote className="h-8 w-8" />
                            <span>Espécie</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-24 hover:border-primary hover:bg-primary/5"
                            onClick={() => handlePayOrder(currentSelectedOrder.id, 'pix')}
                          >
                            <PixIcon size={32} />
                            <span>Pix</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-24 hover:border-primary hover:bg-primary/5"
                            onClick={() => handlePayOrder(currentSelectedOrder.id, 'card')}
                          >
                            <CreditCard className="h-8 w-8" />
                            <span>Cartão</span>
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Quantity Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quantos deseja cancelar?</AlertDialogTitle>
            <AlertDialogDescription>
              Este item possui {cancelTargetItem?.maxQty} unidade(s). Informe quantas deseja cancelar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              type="number"
              min="1"
              max={cancelTargetItem?.maxQty}
              value={cancelQuantity}
              onChange={(e) => setCancelQuantity(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Itens
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
