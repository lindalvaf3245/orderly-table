import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { OrdersSection } from '@/components/OrdersSection';
import { ProductsSection } from '@/components/ProductsSection';
import { HistorySection } from '@/components/HistorySection';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import Logo from '@/assets/jailma-logo.png';
import { set } from 'date-fns';

type Section = 'orders' | 'products' | 'history' | 'analytics';

const Index = () => {
  const [currentSection, setCurrentSection] = useState<Section>('orders');

  async function onExportClick() {
  const openOrders = JSON.parse(
    localStorage.getItem('restaurant_open_orders') || '[]'
  );
  const orderHistory = JSON.parse(
    localStorage.getItem('restaurant_order_history') || '[]'
  );
  const products = JSON.parse(
    localStorage.getItem('restaurant_products') || '[]'
  );

  const data = {
    openOrders,
    orderHistory,
    products,
  };

  const jsonString = JSON.stringify(data, null, 2);

  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `jailma_data_${new Date().toISOString()}.json`,
      types: [
        {
          description: 'JSON file',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(jsonString);
    await writable.close();

    alert('Arquivo salvo com sucesso! ✅');
  } catch (err) {
    console.log('Usuário cancelou o salvamento');
  }
}

  function onImportClick() {
    document.getElementById('import-json')?.click();
  }

  setTimeout(() => {
      document.getElementById('import-json').addEventListener('change', function (event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result as string);
        console.log('Dados importados:', data);

        // ✅ valida estrutura mínima
        if (
          !Array.isArray(data.openOrders) ||
          !Array.isArray(data.orderHistory) ||
          !Array.isArray(data.products)
        ) {
          alert('Arquivo inválido ou incompatível ❌');
          return;
        }


        // ⚠️ confirmação
        const ok = confirm(
          'Isso irá substituir todos os dados atuais.\nDeseja continuar?'
        );
        if (!ok) return;

        // 🔄 restaura exatamente como seu sistema espera
        localStorage.setItem(
          'restaurant_open_orders',
          JSON.stringify(data.openOrders)
        );
        localStorage.setItem(
          'restaurant_order_history',
          JSON.stringify(data.orderHistory)
        );
        localStorage.setItem(
          'restaurant_products',
          JSON.stringify(data.products)
        );

        alert('Dados importados com sucesso! ✅');
        location.reload(); // opcional
      } catch (err) {
        alert('Erro ao ler o arquivo JSON ❌');
        console.error(err);
      }
    };

    reader.readAsText(file);

    // limpa input para permitir importar o mesmo arquivo novamente
    (event.target as HTMLInputElement).value = '';
  });
  }, 1000);




  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border z-40">
        <div className="container max-w-screen-xl flex justify-between items-center mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="h-24 " />
            <div>
              <h1 className="text-lg font-bold text-foreground">Jailma Mesas e Comandas</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
            <div className='gap-4 flex'>
              <button onClick={onImportClick} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium">
                Importar
              </button>
              <input type="file" accept='application/json' id="import-json" className="hidden" />
              <button onClick={onExportClick} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium">
                Exportar
              </button>
            </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden sm:block sticky top-[73px] z-30 bg-background">
        <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      </div>

      {/* Main Content */}
      <main className="container max-w-screen-xl mx-auto px-4 py-6">
        {currentSection === 'orders' && <OrdersSection />}
        {currentSection === 'products' && <ProductsSection />}
        {currentSection === 'history' && <HistorySection />}
        {currentSection === 'analytics' && <AnalyticsSection />}
      </main>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      </div>
    </div>
  );
};

export default Index;
