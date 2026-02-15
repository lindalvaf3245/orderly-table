import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SEPARATOR = '--------------------------';
const SEPARATOR_DOUBLE = '============================';

interface KitchenTicketData {
  orderName: string;
  items: { name: string; quantity: number }[];
  timestamp: string;
  notes?: string;
}

export default function KitchenTicket() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<KitchenTicketData | null>(null);

  useEffect(() => {
    const raw = searchParams.get('data');
    if (raw) {
      try {
        setData(JSON.parse(decodeURIComponent(raw)));
      } catch {
        setData(null);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (data) {
      document.title = `Pedido Cozinha - ${data.orderName}`;
      document.getElementsByTagName('aside')[0]?.remove();
      setTimeout(() => window.print(), 500);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Dados do pedido não encontrados.</p>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white text-black p-2 font-mono" style={{ maxWidth: '58mm', margin: '0 auto' }}>
      <p className="text-center text-sm font-bold">*** PEDIDO COZINHA ***</p>
      <p className="text-center">{SEPARATOR}</p>

      {/* Order Name - large */}
      <p className="font-bold text-lg text-center">{data.orderName}</p>
      <p className="font-bold text-lg text-center">{formatTime(data.timestamp)}</p>
      <p>{SEPARATOR_DOUBLE}</p>

      {/* Items - prominent */}
      {data.items.map((item, idx) => (
        <p key={idx} className="text-lg font-bold text-center py-1">
          {item.quantity}x {item.name}
        </p>
      ))}

      {/* Notes */}
      {data.notes && (
        <>
          <p>{SEPARATOR}</p>
          <p className="text-base font-bold text-center">OBS: {data.notes}</p>
        </>
      )}

      <p>{SEPARATOR_DOUBLE}</p>
      <p className="text-center text-sm font-bold pt-1">Preparar com atenção!</p>
    </div>
  );
}
