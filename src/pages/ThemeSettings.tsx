
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/layout/PageHeader';

interface ColorTheme {
  name: string;
  value: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  description: string;
}

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();
  const [currentColorTheme, setCurrentColorTheme] = React.useState<string>(
    localStorage.getItem('color-theme') || 'default'
  );
  
  const colorThemes: ColorTheme[] = [
    {
      name: 'Light Green',
      value: 'green',
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      background: '#F0FDF4',
      description: 'Fresh and natural theme with green accents'
    },
    {
      name: 'Black',
      value: 'black',
      primary: '#1F2937',
      secondary: '#111827',
      accent: '#374151',
      background: '#F9FAFB',
      description: 'Sleek and modern black theme'
    },
    {
      name: 'Gold',
      value: 'gold',
      primary: '#D97706',
      secondary: '#B45309',
      accent: '#F59E0B',
      background: '#FFFBEB',
      description: 'Luxurious gold theme for premium look'
    },
    {
      name: 'Rose Gold',
      value: 'rosegold',
      primary: '#E07A5F',
      secondary: '#C96D4F',
      accent: '#F4A261',
      background: '#FFF5F0',
      description: 'Elegant rose gold metallic theme'
    },
    {
      name: 'Yellow',
      value: 'yellow',
      primary: '#EAB308',
      secondary: '#CA8A04',
      accent: '#FDE047',
      background: '#FEFCE8',
      description: 'Bright and cheerful yellow theme'
    },
    {
      name: 'Indigo',
      value: 'indigo',
      primary: '#6366F1',
      secondary: '#4F46E5',
      accent: '#818CF8',
      background: '#EEF2FF',
      description: 'Deep and professional indigo theme'
    },
    {
      name: 'Emerald',
      value: 'emerald',
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399',
      background: '#ECFDF5',
      description: 'Rich emerald green theme'
    },
    {
      name: 'Cyan',
      value: 'cyan',
      primary: '#06B6D4',
      secondary: '#0891B2',
      accent: '#22D3EE',
      background: '#ECFEFF',
      description: 'Fresh and vibrant cyan theme'
    },
    {
      name: 'Lime',
      value: 'lime',
      primary: '#84CC16',
      secondary: '#65A30D',
      accent: '#A3E635',
      background: '#F7FEE7',
      description: 'Energetic lime green theme'
    },
    {
      name: 'Amber',
      value: 'amber',
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FCD34D',
      background: '#FEF3C7',
      description: 'Warm amber theme'
    },
    {
      name: 'Fuchsia',
      value: 'fuchsia',
      primary: '#D946EF',
      secondary: '#C026D3',
      accent: '#E879F9',
      background: '#FAE8FF',
      description: 'Bold and vibrant fuchsia theme'
    },
    {
      name: 'Crimson',
      value: 'crimson',
      primary: '#DC2626',
      secondary: '#B91C1C',
      accent: '#EF4444',
      background: '#FEF2F2',
      description: 'Bold crimson red theme'
    },
    {
      name: 'Navy',
      value: 'navy',
      primary: '#1E3A8A',
      secondary: '#1E40AF',
      accent: '#3B82F6',
      background: '#EFF6FF',
      description: 'Classic navy blue theme'
    },
    {
      name: 'Mint',
      value: 'mint',
      primary: '#14B8A6',
      secondary: '#0D9488',
      accent: '#5EEAD4',
      background: '#F0FDFA',
      description: 'Cool and refreshing mint theme'
    },
    {
      name: 'Coral',
      value: 'coral',
      primary: '#F87171',
      secondary: '#EF4444',
      accent: '#FCA5A5',
      background: '#FEE2E2',
      description: 'Vibrant coral pink theme'
    },
    {
      name: 'Lavender',
      value: 'lavender',
      primary: '#A78BFA',
      secondary: '#8B5CF6',
      accent: '#C4B5FD',
      background: '#F5F3FF',
      description: 'Soft and calming lavender theme'
    },
    {
      name: 'Slate',
      value: 'slate',
      primary: '#475569',
      secondary: '#334155',
      accent: '#64748B',
      background: '#F8FAFC',
      description: 'Sophisticated slate grey theme'
    },
    {
      name: 'Violet',
      value: 'violet',
      primary: '#7C3AED',
      secondary: '#6D28D9',
      accent: '#8B5CF6',
      background: '#F5F3FF',
      description: 'Rich violet purple theme'
    },
    {
      name: 'Pink',
      value: 'pink',
      primary: '#EC4899',
      secondary: '#DB2777',
      accent: '#F472B6',
      background: '#FDF2F8',
      description: 'Playful pink theme'
    },
    {
      name: 'Bronze',
      value: 'bronze',
      primary: '#92400E',
      secondary: '#78350F',
      accent: '#A16207',
      background: '#FEF3C7',
      description: 'Warm bronze metallic theme'
    },
    {
      name: 'Sapphire',
      value: 'sapphire',
      primary: '#0C4A6E',
      secondary: '#075985',
      accent: '#0284C7',
      background: '#F0F9FF',
      description: 'Deep sapphire blue theme'
    },
    {
      name: 'Grey',
      value: 'grey',
      primary: '#6B7280',
      secondary: '#4B5563',
      accent: '#9CA3AF',
      background: '#F9FAFB',
      description: 'Professional and clean grey theme'
    },
    {
      name: 'Sky Blue',
      value: 'sky',
      primary: '#0EA5E9',
      secondary: '#0284C7',
      accent: '#38BDF8',
      background: '#F0F9FF',
      description: 'Calm and modern sky blue theme'
    },
    {
      name: 'Purple',
      value: 'purple',
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA',
      background: '#FAF5FF',
      description: 'Creative and vibrant purple theme'
    },
    {
      name: 'Rose',
      value: 'rose',
      primary: '#F43F5E',
      secondary: '#E11D48',
      accent: '#FB7185',
      background: '#FFF1F2',
      description: 'Warm and elegant rose theme'
    },
    {
      name: 'Orange',
      value: 'orange',
      primary: '#F97316',
      secondary: '#EA580C',
      accent: '#FB923C',
      background: '#FFF7ED',
      description: 'Energetic and warm orange theme'
    },
    {
      name: 'Teal',
      value: 'teal',
      primary: '#14B8A6',
      secondary: '#0F766E',
      accent: '#5EEAD4',
      background: '#F0FDFA',
      description: 'Refreshing and calming teal theme'
    },
    {
      name: 'Default',
      value: 'default',
      primary: '#3B82F6',
      secondary: '#2563EB',
      accent: '#60A5FA',
      background: '#FFFFFF',
      description: 'Original Hisab Kitab theme'
    }
  ];

  const handleColorThemeChange = (colorTheme: string) => {
    localStorage.setItem('color-theme', colorTheme);
    setCurrentColorTheme(colorTheme);
    
    const root = document.documentElement;
    
    switch (colorTheme) {
      case 'green':
        root.style.setProperty('--primary', '142 69% 58%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '142 76% 36%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '142 69% 58%');
        root.style.setProperty('--sidebar-accent', '142 76% 36%');
        break;
      case 'black':
        root.style.setProperty('--primary', '215 28% 17%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '215 20% 27%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '215 28% 17%');
        root.style.setProperty('--sidebar-accent', '215 20% 27%');
        break;
      case 'gold':
        root.style.setProperty('--primary', '32 94% 43%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '38 92% 50%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '32 94% 43%');
        root.style.setProperty('--sidebar-accent', '38 92% 50%');
        break;
      case 'rosegold':
        root.style.setProperty('--primary', '13 66% 62%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '29 79% 68%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '13 66% 62%');
        root.style.setProperty('--sidebar-accent', '29 79% 68%');
        break;
      case 'yellow':
        root.style.setProperty('--primary', '47 96% 53%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '54 96% 64%');
        root.style.setProperty('--accent-foreground', '24 9% 10%');
        root.style.setProperty('--sidebar-background', '47 96% 53%');
        root.style.setProperty('--sidebar-accent', '54 96% 64%');
        break;
      case 'indigo':
        root.style.setProperty('--primary', '239 84% 67%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '243 75% 69%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '239 84% 67%');
        root.style.setProperty('--sidebar-accent', '243 75% 69%');
        break;
      case 'emerald':
        root.style.setProperty('--primary', '160 84% 39%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '158 64% 52%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '160 84% 39%');
        root.style.setProperty('--sidebar-accent', '158 64% 52%');
        break;
      case 'cyan':
        root.style.setProperty('--primary', '188 94% 43%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '186 94% 59%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '188 94% 43%');
        root.style.setProperty('--sidebar-accent', '186 94% 59%');
        break;
      case 'lime':
        root.style.setProperty('--primary', '84 81% 44%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '83 78% 56%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '84 81% 44%');
        root.style.setProperty('--sidebar-accent', '83 78% 56%');
        break;
      case 'amber':
        root.style.setProperty('--primary', '38 92% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '48 96% 58%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '38 92% 50%');
        root.style.setProperty('--sidebar-accent', '48 96% 58%');
        break;
      case 'fuchsia':
        root.style.setProperty('--primary', '292 84% 61%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '291 64% 72%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '292 84% 61%');
        root.style.setProperty('--sidebar-accent', '291 64% 72%');
        break;
      case 'crimson':
        root.style.setProperty('--primary', '0 84% 60%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '0 72% 51%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '0 84% 60%');
        root.style.setProperty('--sidebar-accent', '0 72% 51%');
        break;
      case 'navy':
        root.style.setProperty('--primary', '219 79% 32%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '221 83% 53%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '219 79% 32%');
        root.style.setProperty('--sidebar-accent', '221 83% 53%');
        break;
      case 'mint':
        root.style.setProperty('--primary', '173 80% 40%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '172 82% 57%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '173 80% 40%');
        root.style.setProperty('--sidebar-accent', '172 82% 57%');
        break;
      case 'coral':
        root.style.setProperty('--primary', '0 77% 72%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '0 86% 80%');
        root.style.setProperty('--accent-foreground', '0 72% 51%');
        root.style.setProperty('--sidebar-background', '0 77% 72%');
        root.style.setProperty('--sidebar-accent', '0 86% 80%');
        break;
      case 'lavender':
        root.style.setProperty('--primary', '256 58% 76%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '262 68% 84%');
        root.style.setProperty('--accent-foreground', '262 83% 58%');
        root.style.setProperty('--sidebar-background', '256 58% 76%');
        root.style.setProperty('--sidebar-accent', '262 68% 84%');
        break;
      case 'slate':
        root.style.setProperty('--primary', '215 20% 40%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '215 16% 47%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '215 20% 40%');
        root.style.setProperty('--sidebar-accent', '215 16% 47%');
        break;
      case 'violet':
        root.style.setProperty('--primary', '262 83% 58%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '258 90% 66%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '262 83% 58%');
        root.style.setProperty('--sidebar-accent', '258 90% 66%');
        break;
      case 'pink':
        root.style.setProperty('--primary', '330 81% 60%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '330 77% 72%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '330 81% 60%');
        root.style.setProperty('--sidebar-accent', '330 77% 72%');
        break;
      case 'bronze':
        root.style.setProperty('--primary', '30 83% 34%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '42 78% 32%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '30 83% 34%');
        root.style.setProperty('--sidebar-accent', '42 78% 32%');
        break;
      case 'sapphire':
        root.style.setProperty('--primary', '202 96% 27%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '199 89% 48%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '202 96% 27%');
        root.style.setProperty('--sidebar-accent', '199 89% 48%');
        break;
      case 'grey':
        root.style.setProperty('--primary', '220 9% 46%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '220 13% 69%');
        root.style.setProperty('--accent-foreground', '220 9% 46%');
        root.style.setProperty('--sidebar-background', '220 9% 46%');
        root.style.setProperty('--sidebar-accent', '220 13% 69%');
        break;
      case 'sky':
        root.style.setProperty('--primary', '199 89% 48%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '198 93% 60%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '199 89% 48%');
        root.style.setProperty('--sidebar-accent', '198 93% 60%');
        break;
      case 'purple':
        root.style.setProperty('--primary', '262 83% 58%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '262 68% 70%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '262 83% 58%');
        root.style.setProperty('--sidebar-accent', '262 68% 70%');
        break;
      case 'rose':
        root.style.setProperty('--primary', '347 77% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '347 89% 60%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '347 77% 50%');
        root.style.setProperty('--sidebar-accent', '347 89% 60%');
        break;
      case 'orange':
        root.style.setProperty('--primary', '20 91% 48%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '20 91% 67%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '20 91% 48%');
        root.style.setProperty('--sidebar-accent', '20 91% 67%');
        break;
      case 'teal':
        root.style.setProperty('--primary', '172 66% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '172 44% 37%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '172 66% 50%');
        root.style.setProperty('--sidebar-accent', '172 44% 37%');
        break;
      default:
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--accent', '221.2 83.2% 53.3%');
        root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
        root.style.setProperty('--sidebar-background', '221.2 83.2% 53.3%');
        root.style.setProperty('--sidebar-accent', '217 91.2% 59.8%');
        break;
    }
    
    window.dispatchEvent(new Event('storage'));
  };

  React.useEffect(() => {
    handleColorThemeChange(currentColorTheme);
  }, []);

  return (
    <PageWrapper 
      title="Theme Settings" 
      subtitle="Customize the appearance and colors of your Hisab Kitab application"
      icon={<Palette className="h-6 w-6" />}
    >
      <PageHeader title="Theme Settings" />

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Dark/Light Mode Toggle */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Display Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                {theme === 'light' && <Check className="h-4 w-4" />}
                Light Mode
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                {theme === 'dark' && <Check className="h-4 w-4" />}
                Dark Mode
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                {theme === 'system' && <Check className="h-4 w-4" />}
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Theme Selection */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Color Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {colorThemes.map((colorTheme, index) => (
                <div
                  key={colorTheme.value}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-fade-in ${
                    currentColorTheme === colorTheme.value
                      ? 'border-primary bg-primary/10 shadow-lg scale-105'
                      : 'border-border hover:border-primary/50 hover:bg-accent/5'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleColorThemeChange(colorTheme.value)}
                >
                  {currentColorTheme === colorTheme.value && (
                    <div className="absolute top-3 right-3 animate-scale-in">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full border-4 border-white shadow-lg transition-transform duration-300 hover:rotate-12"
                        style={{ backgroundColor: colorTheme.primary }}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: colorTheme.accent }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {colorTheme.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {colorTheme.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced Color Preview */}
                  <div className="flex gap-2 mb-3">
                    <div
                      className="flex-1 h-6 rounded-lg shadow-inner transition-all duration-300 hover:h-8"
                      style={{ backgroundColor: colorTheme.primary }}
                    />
                    <div
                      className="flex-1 h-6 rounded-lg shadow-inner transition-all duration-300 hover:h-8"
                      style={{ backgroundColor: colorTheme.secondary }}
                    />
                    <div
                      className="flex-1 h-6 rounded-lg shadow-inner transition-all duration-300 hover:h-8"
                      style={{ backgroundColor: colorTheme.accent }}
                    />
                  </div>
                  
                  {/* Sample UI Elements */}
                  <div className="space-y-2">
                    <div 
                      className="h-3 rounded-full opacity-60"
                      style={{ backgroundColor: colorTheme.primary }}
                    />
                    <div 
                      className="h-2 rounded-full opacity-40 w-3/4"
                      style={{ backgroundColor: colorTheme.accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Preview Section */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Live Theme Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-6 bg-primary text-primary-foreground rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-102">
                  <h3 className="font-semibold text-lg mb-2">Primary Elements</h3>
                  <p className="text-sm opacity-90">Main buttons, highlights, and key actions</p>
                  <div className="mt-4 h-2 bg-primary-foreground/20 rounded-full">
                    <div className="h-2 bg-primary-foreground/60 rounded-full w-3/4 transition-all duration-1000"></div>
                  </div>
                </div>
                
                <div className="p-6 bg-accent text-accent-foreground rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-102">
                  <h3 className="font-semibold text-lg mb-2">Accent Elements</h3>
                  <p className="text-sm opacity-90">Secondary actions and highlights</p>
                  <div className="mt-4 flex gap-2">
                    <div className="h-3 w-3 bg-accent-foreground/60 rounded-full animate-pulse"></div>
                    <div className="h-3 w-3 bg-accent-foreground/40 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="h-3 w-3 bg-accent-foreground/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button className="transition-all duration-200 hover:scale-105">Primary</Button>
                  <Button variant="outline" className="transition-all duration-200 hover:scale-105">Outline</Button>
                  <Button variant="secondary" className="transition-all duration-200 hover:scale-105">Secondary</Button>
                </div>
                
                <div className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-6 w-6 bg-primary rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default ThemeSettings;
