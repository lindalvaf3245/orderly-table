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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  X,
  DollarSign,
  Clock,
  ShoppingBag,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Order } from '@/types/restaurant';
import { toast } from 'sonner';

export function OrdersSection() {
  const { openOrders, createOrder, addItemToOrder, cancelItem, removeItem, cancelOrder, payOrder } = useOrders();
  const { products } = useProducts();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

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

  const handleCancelItem = (orderId: string, itemId: string) => {
    cancelItem(orderId, itemId);
    toast.info('Item cancelado');
  };

  const handleRemoveItem = (orderId: string, itemId: string) => {
    removeItem(orderId, itemId);
    toast.info('Item removido');
  };

  const handlePayOrder = (orderId: string) => {
    payOrder(orderId);
    setSelectedOrder(null);
    toast.success('Pagamento registrado!');
  };

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
    setSelectedOrder(null);
    toast.info('Comanda cancelada');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Update selected order when openOrders changes
  const currentSelectedOrder = selectedOrder
    ? openOrders.find((o) => o.id === selectedOrder.id) || null
    : null;

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
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsNewOrderOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Abrir Comanda
                </Button>
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
            <p className="text-muted-foreground mt-1">
              Clique em "Nova Comanda" para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openOrders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => setSelectedOrder(order)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{order.name}</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(order.openedAt)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {order.items.filter((i) => !i.cancelled).length} item(ns)
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(order.total)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={!!currentSelectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {currentSelectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-xl">
                    {currentSelectedOrder.name}
                  </DialogTitle>
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
                        <Select
                          value={selectedProductId}
                          onValueChange={setSelectedProductId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsAddItemOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                          Adicionar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Itens
                  </h4>
                  {currentSelectedOrder.items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentSelectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.cancelled
                              ? 'bg-muted/50 opacity-60'
                              : 'bg-card'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${
                                item.cancelled ? 'line-through' : ''
                              }`}
                            >
                              {item.quantity}x {item.productName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.unitPrice)} cada
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                item.cancelled ? 'line-through' : ''
                              }`}
                            >
                              {formatCurrency(item.total)}
                            </span>
                            {!item.cancelled ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleCancelItem(currentSelectedOrder.id, item.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleRemoveItem(currentSelectedOrder.id, item.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(currentSelectedOrder.total)}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <RotateCcw className="h-5 w-5" />
                        Cancelar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar comanda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A comanda "{currentSelectedOrder.name}" será cancelada
                          e movida para o histórico.
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

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="lg"
                        className="gap-2 bg-success hover:bg-success/90"
                        disabled={currentSelectedOrder.total === 0}
                      >
                        <DollarSign className="h-5 w-5" />
                        Pagar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar pagamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Total: {formatCurrency(currentSelectedOrder.total)}
                          <br />A comanda será finalizada e movida para o histórico.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePayOrder(currentSelectedOrder.id)}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          Confirmar Pagamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
