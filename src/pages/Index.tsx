import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { OrdersSection } from '@/components/OrdersSection';
import { ProductsSection } from '@/components/ProductsSection';
import { HistorySection } from '@/components/HistorySection';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { SettingsSection } from '@/components/SettingsSection';
import DefaultLogo from '@/assets/jailma-logo.png';
import { useSettings } from '@/hooks/useSettings';

type Section = 'orders' | 'products' | 'history' | 'analytics' | 'settings';

const Index = () => {
  const [currentSection, setCurrentSection] = useState<Section>('orders');
  const { settings } = useSettings();

  // Apply dynamic colors
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--ring', settings.primaryColor);
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--ring');
    };
  }, [settings.primaryColor, settings.accentColor]);


  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <header className="sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border z-40">
        <div className="container max-w-screen-xl flex justify-between items-center mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={settings.logoUrl || DefaultLogo} alt="Logo" className="h-24" />
            <div>
              <h1 className="text-lg font-bold text-foreground">{settings.title}</h1>
              <p className="text-xs text-muted-foreground">{settings.subtitle}</p>
            </div>
          </div>
          <div className="gap-4 flex">
            <button onClick={onImportClick} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium">
              Importar
            </button>
            <input type="file" accept="application/json" id="import-json" className="hidden" />
            <button onClick={onExportClick} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium">
              Exportar
            </button>
          </div>
        </div>
      </header>

      <div className="hidden sm:block sticky top-[73px] z-30 bg-background">
        <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      </div>

      <main className="container max-w-screen-xl mx-auto px-4 py-6">
        {currentSection === 'orders' && <OrdersSection />}
        {currentSection === 'products' && <ProductsSection />}
        {currentSection === 'history' && <HistorySection />}
        {currentSection === 'analytics' && <AnalyticsSection />}
        {currentSection === 'settings' && <SettingsSection />}
      </main>

      <div className="sm:hidden">
        <Navigation currentSection={currentSection} onSectionChange={setCurrentSection} />
      </div>
    </div>
  );
};

export default Index;
