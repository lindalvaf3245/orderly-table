import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Logo from '@/assets/jailma-logo.png';

const SEPARATOR = '--------------------------';
const SEPARATOR_DOUBLE = '============================';

interface KitchenTicketData {
  orderName: string;
  items: { name: string; quantity: number }[];
  timestamp: string;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

      <p className="font-bold text-center text-base">*** PEDIDO COZINHA ***</p>
      <p className="text-center">{SEPARATOR}</p>

      {/* Order Info */}
      <p className="font-bold text-base">{data.orderName}</p>
      <p>Horário: {formatDateTime(data.timestamp)}</p>
      <p>{SEPARATOR_DOUBLE}</p>

      {/* Items */}
      <div className="flex justify-between font-bold">
        <span>Qtd</span>
        <span>Produto</span>
      </div>
      <p>{SEPARATOR}</p>
      {data.items.map((item, idx) => (
        <div key={idx} className="flex justify-between text-base font-bold py-1">
          <span>{item.quantity}x</span>
          <span>{item.name}</span>
        </div>
      ))}
      <p>{SEPARATOR_DOUBLE}</p>

      {/* Footer */}
      <div className="text-center pt-1">
        <p className="font-bold">Preparar com atenção!</p>
        <p className="text-[10px] mt-1">Impresso em {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}
