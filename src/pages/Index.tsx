import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { OrdersSection } from '@/components/OrdersSection';
import { ProductsSection } from '@/components/ProductsSection';
import { HistorySection } from '@/components/HistorySection';
import Logo from '@/assets/jailma-logo.png';

type Section = 'orders' | 'products' | 'history';

const Index = () => {
  const [currentSection, setCurrentSection] = useState<Section>('orders');

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border z-40">
        <div className="container max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="h-24 " />
            <div>
              <h1 className="text-lg font-bold text-foreground">Jailma Mesas e Comandas</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
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
      </main>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      </div>
    </div>
  );
};

export default Index;
