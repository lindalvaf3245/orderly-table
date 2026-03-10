import { useLocalStorage } from './useLocalStorage';

export interface SystemSettings {
  title: string;
  subtitle: string;
  logoUrl: string | null;
  primaryColor: string; // HSL values like "25 95% 50%"
  accentColor: string;
}

const defaultSettings: SystemSettings = {
  title: 'Jailma Mesas e Comandas',
  subtitle: 'Sistema de Gestão',
  logoUrl: null,
  primaryColor: '25 95% 50%',
  accentColor: '142 70% 45%',
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<SystemSettings>('restaurant_settings', defaultSettings);

  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return { settings, updateSettings, resetSettings, defaultSettings };
}
