import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Order } from '@/types/restaurant';
import Logo from '@/assets/jailma-logo.png';

const OPEN_ORDERS_KEY = 'restaurant_open_orders';
const ORDER_HISTORY_KEY = 'restaurant_order_history';

const SEPARATOR = '--------------------------';
const SEPARATOR_DOUBLE = '============================';

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cash': return 'Espécie';
    case 'pix': return 'Pix';
    case 'card': return 'Cartão';
    default: return method;
  }
};

export default function OrderReceipt() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const openOrders: Order[] = JSON.parse(localStorage.getItem(OPEN_ORDERS_KEY) || '[]');
    const orderHistory: Order[] = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
    const foundOrder = openOrders.find((o) => o.id === orderId) || 
                       orderHistory.find((o) => o.id === orderId);
    setOrder(foundOrder || null);
  }, [orderId]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Comanda não encontrada.</p>
      </div>
    );
  }

  document.title = `Comanda ${order.name} - ${formatCurrency(order.total)}`;
  document.getElementsByTagName('aside')[0]?.remove();

  const activeItems = order.items.filter((item) => !item.cancelled);
  const stackedItems = activeItems.reduce<{ productName: string; quantity: number; unitPrice: number; total: number }[]>((acc, item) => {
    const existing = acc.find((a) => a.productName === item.productName && a.unitPrice === item.unitPrice);
    if (existing) {
      existing.quantity += item.quantity;
      existing.total += item.total;
    } else {
      acc.push({ productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total });
    }
    return acc;


  }, []);

  const partialPayments = order.partialPayments || [];
  const totalPaid = partialPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, order.total - totalPaid);

  return (
    <div className="min-h-screen bg-white text-black p-2 font-mono text-sm" style={{ maxWidth: '58mm', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center">
        <p className="font-bold text-sm">Jailma Lanches e Petiscos</p>
        <div className='flex justify-center items-center'>
        <img src={Logo} alt="Logo" className='grayscale h-24' />

        </div>
        <p className="text-[10px]">
          Rua Sertãozinho, 105 - Diogo Lopes
        </p>
        <p className="text-[10px]">
          Tel: (84) 98604-0039
        </p>
      </div>
      <p className="text-center">{SEPARATOR}</p>

      {/* Order Info */}
      <p className="font-bold">{order.name}</p>
      <p>Abertura: {formatDateTime(order.openedAt)}</p>
      {order.closedAt && <p>Fechamento: {formatDateTime(order.closedAt)}</p>}
      <p>{SEPARATOR}</p>

      {/* Items */}
      <div className="flex justify-between font-bold">
        <span>Qtd Produto</span>
        <span>Total</span>
      </div>
      <p>{SEPARATOR}</p>
      {stackedItems.length === 0 ? (
        <p className="text-center py-1">Nenhum item</p>
      ) : (
        stackedItems.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{item.quantity}x {item.productName}</span>
            <span>{formatCurrency(item.total)}</span>
          </div>
        ))
      )}
      <p>{SEPARATOR_DOUBLE}</p>

      {/* Total */}
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      {/* Partial Payments */}
      {partialPayments.length > 0 && (
        <>
          <p>{SEPARATOR}</p>
          <p className="font-bold">PAGAMENTOS:</p>
          {partialPayments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{getPaymentMethodLabel(p.method)}</span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))}
          {order.paymentMethod && remaining < order.total && (
            <div className="flex justify-between">
              <span>{getPaymentMethodLabel(order.paymentMethod)} (final)</span>
              <span>{formatCurrency(remaining > 0 ? remaining : order.total - totalPaid > 0 ? order.total - totalPaid : 0)}</span>
            </div>
          )}
          <p>{SEPARATOR}</p>
          <div className="flex justify-between items-center font-bold">
            <span>TOTAL A PAGAR</span>
            <span className='text-lg'>{formatCurrency(remaining)}</span>
          </div>
        </>
      )}

      {/* Single payment */}
      {partialPayments.length === 0 && order.paymentMethod && (
        <>
          <p>{SEPARATOR}</p>
          <div className="flex justify-between">
            <span>Pagamento:</span>
            <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
          </div>
        </>
      )}

      <p>{SEPARATOR}</p>

      {/* Footer */}
      <div className="text-center pt-1">
        <p>Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
        <p><strong>Deus</strong> seja louvado.</p>
      </div>
    </div>
  );
}
