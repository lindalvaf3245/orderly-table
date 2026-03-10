import { useState, useRef, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, RotateCcw, Paintbrush } from 'lucide-react';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { name: 'Laranja', primary: '25 95% 50%', accent: '142 70% 45%' },
  { name: 'Azul', primary: '220 90% 50%', accent: '180 70% 45%' },
  { name: 'Vermelho', primary: '0 85% 50%', accent: '45 90% 50%' },
  { name: 'Verde', primary: '142 70% 45%', accent: '25 95% 50%' },
  { name: 'Roxo', primary: '270 80% 55%', accent: '330 80% 55%' },
  { name: 'Rosa', primary: '330 80% 55%', accent: '270 60% 55%' },
];

export function SettingsSection() {
  const { settings, updateSettings, resetSettings, defaultSettings } = useSettings();
  const [title, setTitle] = useState(settings.title);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(settings.title);
    setSubtitle(settings.subtitle);
  }, [settings.title, settings.subtitle]);

  const handleSaveText = () => {
    updateSettings({ title, subtitle });
    toast.success('Configurações salvas!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateSettings({ logoUrl: dataUrl });
      toast.success('Logo atualizada!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateSettings({ logoUrl: null });
    toast.success('Logo removida. Usando logo padrão.');
  };

  const handleColorPreset = (primary: string, accent: string) => {
    updateSettings({ primaryColor: primary, accentColor: accent });
    toast.success('Cores atualizadas!');
  };

  const handleReset = () => {
    resetSettings();
    setTitle(defaultSettings.title);
    setSubtitle(defaultSettings.subtitle);
    toast.success('Configurações restauradas ao padrão!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Título e Subtítulo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identidade do Sistema</CardTitle>
          <CardDescription>Nome e subtítulo exibidos no cabeçalho</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sys-title">Título</Label>
            <Input
              id="sys-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do seu estabelecimento"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sys-subtitle">Subtítulo</Label>
            <Input
              id="sys-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex: Sistema de Gestão"
            />
          </div>
          <Button onClick={handleSaveText} className="w-full sm:w-auto">
            Salvar
          </Button>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logo</CardTitle>
          <CardDescription>Imagem exibida no cabeçalho (máx. 2MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded-lg border p-1" />
            ) : (
              <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
                <Upload className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                {settings.logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              {settings.logoUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive">
                  Remover
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </CardContent>
      </Card>

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Cores do Sistema
          </CardTitle>
          <CardDescription>Escolha um tema de cores para o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_PRESETS.map((preset) => {
              const isActive = settings.primaryColor === preset.primary;
              return (
                <button
                  key={preset.name}
                  onClick={() => handleColorPreset(preset.primary, preset.accent)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isActive ? 'border-foreground shadow-md' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.primary})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.accent})` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reset */}
      <Button variant="outline" onClick={handleReset} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Restaurar padrão
      </Button>
    </div>
  );
}
