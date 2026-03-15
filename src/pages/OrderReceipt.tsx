import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Order, PaymentMethod } from '@/types/restaurant';
import Logo from '@/assets/jailma-logo-bw.png';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), partial_payments(*)')
        .eq('id', orderId)
        .maybeSingle();

      if (data) {
        setOrder({
          id: data.id,
          name: data.name,
          openedAt: data.opened_at,
          closedAt: data.closed_at || undefined,
          status: data.status as Order['status'],
          total: Number(data.total),
          discount: Number(data.discount) || undefined,
          paymentMethod: (data.payment_method as PaymentMethod) || undefined,
          items: (data.order_items || []).map((i: any) => ({
            id: i.id,
            productId: i.product_id || '',
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            total: Number(i.total),
            cancelled: i.cancelled,
          })),
          partialPayments: (data.partial_payments || []).map((p: any) => ({
            id: p.id,
            amount: Number(p.amount),
            method: p.method as PaymentMethod,
            paidAt: p.paid_at,
          })),
        });
      }
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

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

  setTimeout(() => { window.print(); }, 500);

  return (
    <div className="min-h-screen bg-white text-black p-2 font-mono text-sm" style={{ maxWidth: '58mm', margin: '0 auto' }}>
      <div className="text-center">
        <p className="font-bold text-sm">Jailma Lanches e Petiscos</p>
        <div className='flex justify-center items-center'>
          <img src={Logo} alt="Logo" className='grayscale h-40' />
        </div>
        <p className="text-[10px]">Rua Sertãozinho, 105 - Diogo Lopes</p>
        <p className="text-[10px]">Tel: (84) 9 8604-0039</p>
      </div>
      <p className="text-center">{SEPARATOR}</p>

      <p className="font-bold">{order.name}</p>
      <p>Abertura: {formatDateTime(order.openedAt)}</p>
      {order.closedAt && <p>Fechamento: {formatDateTime(order.closedAt)}</p>}
      <p>{SEPARATOR}</p>

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

      {(order.discount ?? 0) > 0 && (
        <>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.items.filter(i => !i.cancelled).reduce((s, i) => s + i.total, 0))}</span>
          </div>
          <div className="flex justify-between">
            <span>Desconto</span>
            <span>-{formatCurrency(order.discount!)}</span>
          </div>
          <p>{SEPARATOR}</p>
        </>
      )}

      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

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
      <div className="text-center pt-1">
        <p>Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
        <p><strong>Deus</strong> seja louvado.</p>
      </div>
    </div>
  );
}
