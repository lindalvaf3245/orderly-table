import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Order } from '@/types/restaurant';

const OPEN_ORDERS_KEY = 'restaurant_open_orders';
const ORDER_HISTORY_KEY = 'restaurant_order_history';

export default function OrderReceipt() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Try to find the order in open orders or history
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

  const activeItems = order.items.filter((item) => !item.cancelled);

  return (
    <div className="min-h-screen bg-white text-black p-6 font-mono text-sm">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase">Jailma Restaurante</h1>
          <p className="text-xs text-gray-600 mt-1">
            Rua Exemplo, 123 - Centro
            <br />
            Cidade - Estado | CEP: 00000-000
            <br />
            Tel: (00) 0000-0000
          </p>
        </header>

        {/* Order Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <p className="font-bold">{order.name}</p>
          <p className="text-xs text-gray-600">
            Abertura: {formatDateTime(order.openedAt)}
          </p>
          {order.closedAt && (
            <p className="text-xs text-gray-600">
              Fechamento: {formatDateTime(order.closedAt)}
            </p>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-2 w-12">Qtd.</th>
              <th className="text-left py-2">Produto</th>
              <th className="text-right py-2 w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {activeItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  Nenhum item
                </td>
              </tr>
            ) : (
              activeItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Total */}
        <div className="border-t-2 border-dashed border-gray-400 pt-3 mb-6">
          <div className="flex justify-between items-center font-bold text-lg">
            <span>TOTAL</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center border-t border-dashed border-gray-400 pt-4">
          <p className="text-xs text-gray-600 mb-2">
            Obrigado pela preferência!
          </p>
          <p className="text-xs text-gray-500">
            Volte sempre!
          </p>
        </footer>
      </div>
    </div>
  );
}
