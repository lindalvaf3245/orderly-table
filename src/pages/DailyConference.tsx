import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Order, PaymentMethod } from '@/types/restaurant';
import Logo from '@/assets/jailma-logo.png';

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

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DayData {
  date: string;
  orders: Order[];
}

export default function DailyConference() {
  const [searchParams] = useSearchParams();
  const [dayData, setDayData] = useState<DayData | null>(null);

  useEffect(() => {
    const raw = searchParams.get('data');
    if (raw) {
      try {
        setDayData(JSON.parse(decodeURIComponent(raw)));
      } catch {
        setDayData(null);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (dayData) {
      document.title = `Conferência ${dayData.date}`;
      document.getElementsByTagName('aside')[0]?.remove();
      setTimeout(() => window.print(), 500);
    }
  }, [dayData]);

  if (!dayData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Dados não encontrados.</p>
      </div>
    );
  }

  const { date, orders } = dayData;
  const paidOrders = orders.filter(o => o.status === 'paid');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // Totals by payment method
  const methodTotals: Record<string, number> = {};
  paidOrders.forEach(order => {
    const partials = order.partialPayments || [];
    partials.forEach(p => {
      methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
    });
    // Final payment (remaining after partials)
    if (order.paymentMethod) {
      const totalPartial = partials.reduce((s, p) => s + p.amount, 0);
      const finalAmount = Math.max(0, order.total - totalPartial);
      if (finalAmount > 0) {
        methodTotals[order.paymentMethod] = (methodTotals[order.paymentMethod] || 0) + finalAmount;
      }
    }
  });

  // Items sold (stacked)
  const itemsSold: Record<string, { quantity: number; total: number }> = {};
  paidOrders.forEach(order => {
    order.items.filter(i => !i.cancelled).forEach(item => {
      const key = item.productName;
      if (!itemsSold[key]) {
        itemsSold[key] = { quantity: 0, total: 0 };
      }
      itemsSold[key].quantity += item.quantity;
      itemsSold[key].total += item.total;
    });
  });

  const sortedItems = Object.entries(itemsSold).sort((a, b) => b[1].quantity - a[1].quantity);
  const totalDay = paidOrders.reduce((s, o) => s + o.total, 0);
  const totalMethodSum = Object.values(methodTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen bg-white text-black p-2 font-mono text-sm" style={{ maxWidth: '58mm', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center">
        <p className="font-bold text-sm">Jailma Lanches e Petiscos</p>
        <div className="flex justify-center items-center">
          <img src={Logo} alt="Logo" className="grayscale h-24" />
        </div>
        <p className="text-[10px]">Rua Sertãozinho, 105 - Diogo Lopes</p>
        <p className="text-[10px]">Tel: (84) 98604-0039</p>
      </div>
      <p className="text-center">{SEPARATOR}</p>

      <p className="font-bold text-center">CONFERÊNCIA DO DIA</p>
      <p className="text-center">{date}</p>
      <p>{SEPARATOR}</p>

      {/* Summary */}
      <p className="font-bold">RESUMO</p>
      <div className="flex justify-between">
        <span>Vendas pagas:</span>
        <span>{paidOrders.length}</span>
      </div>
      {cancelledOrders.length > 0 && (
        <div className="flex justify-between">
          <span>Canceladas:</span>
          <span>{cancelledOrders.length}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Total comandas:</span>
        <span>{orders.length}</span>
      </div>
      <p>{SEPARATOR}</p>

      {/* Totals by payment method */}
      <p className="font-bold">TOTAIS POR PAGAMENTO</p>
      <p>{SEPARATOR}</p>
      {Object.entries(methodTotals).map(([method, total]) => (
        <div key={method} className="flex justify-between">
          <span>{getPaymentMethodLabel(method)}</span>
          <span>{formatCurrency(total)}</span>
        </div>
      ))}
      <p>{SEPARATOR_DOUBLE}</p>
      <div className="flex justify-between font-bold">
        <span>TOTAL GERAL</span>
        <span>{formatCurrency(totalDay)}</span>
      </div>
      <p>{SEPARATOR}</p>

      {/* Items sold */}
      <p className="font-bold">PRODUTOS VENDIDOS</p>
      <p>{SEPARATOR}</p>
      <div className="flex justify-between font-bold">
        <span>Qtd Produto</span>
        <span>Total</span>
      </div>
      <p>{SEPARATOR}</p>
      {sortedItems.map(([name, data]) => (
        <div key={name} className="flex justify-between">
          <span>{data.quantity}x {name}</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
      ))}
      <p>{SEPARATOR_DOUBLE}</p>
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{formatCurrency(totalDay)}</span>
      </div>

      <p>{SEPARATOR}</p>

      {/* Footer */}
      <div className="text-center pt-1">
        <p>Conferência gerada em</p>
        <p>{new Date().toLocaleString('pt-BR')}</p>
        <p className="mt-1"><strong>Deus</strong> seja louvado.</p>
      </div>
    </div>
  );
}
