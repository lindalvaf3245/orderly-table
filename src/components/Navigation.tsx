import { ShoppingBag, Package, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

type Section = 'orders' | 'products' | 'history';

interface NavigationProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems = [
  { id: 'orders' as Section, label: 'Comandas', icon: ShoppingBag },
  { id: 'products' as Section, label: 'Produtos', icon: Package },
  { id: 'history' as Section, label: 'Histórico', icon: History },
];

useEffect(() => {
  const aside = document.getElementsByTagName('aside')[0];
  aside?.remove();
}, []);

export function Navigation({ currentSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 sm:relative sm:border-t-0 sm:border-b">
      <div className="container max-w-screen-xl mx-auto">
        <div className="flex items-center justify-around sm:justify-start sm:gap-1 p-2 sm:p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 sm:py-2.5 rounded-lg transition-all touch-action-manipulation',
                  'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
