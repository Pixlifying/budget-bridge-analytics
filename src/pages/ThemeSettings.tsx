
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, Sparkles, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/layout/PageHeader';
import { setColorTheme, getColorTheme } from '@/lib/themeUtils';
import { Switch } from '@/components/ui/switch';

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
  const [currentColorTheme, setCurrentColorTheme] = React.useState<string>(getColorTheme());
  
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
    setColorTheme(colorTheme);
    setCurrentColorTheme(colorTheme);
  };

  return (
    <PageWrapper 
      title="Theme Settings" 
      subtitle="Customize the appearance and colors of your Hisab Kitab application"
      icon={<Palette className="h-6 w-6" />}
    >
      <PageHeader title="Theme Settings" />

      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Dark/Light Mode Toggle - Enhanced */}
        <Card className="transition-all duration-300 hover:shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Display Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Main Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-yellow-100 text-yellow-600'}`}>
                  {theme === 'dark' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="data-[state=checked]:bg-primary scale-125"
              />
            </div>

            {/* Theme Options */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 hover:scale-105 ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 flex items-center justify-center shadow-lg">
                  <Sun className="h-8 w-8 text-yellow-600" />
                </div>
                <span className="font-medium text-foreground">Light</span>
                {theme === 'light' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 hover:scale-105 ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                  <Moon className="h-8 w-8 text-purple-400" />
                </div>
                <span className="font-medium text-foreground">Dark</span>
                {theme === 'dark' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 hover:scale-105 ${
                  theme === 'system' 
                    ? 'border-primary bg-primary/10 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <span className="font-medium text-foreground">System</span>
                {theme === 'system' && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
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
