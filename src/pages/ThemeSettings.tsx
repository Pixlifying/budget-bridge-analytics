
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/layout/PageHeader';

interface ColorTheme {
  name: string;
  value: string;
  primary: string;
  background: string;
  description: string;
}

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();
  
  const colorThemes: ColorTheme[] = [
    {
      name: 'Light Green',
      value: 'green',
      primary: '#10B981', // emerald-500
      background: '#F0FDF4', // green-50
      description: 'Fresh and natural theme with green accents'
    },
    {
      name: 'Grey',
      value: 'grey',
      primary: '#6B7280', // gray-500
      background: '#F9FAFB', // gray-50
      description: 'Professional and clean grey theme'
    },
    {
      name: 'Sky Blue',
      value: 'sky',
      primary: '#0EA5E9', // sky-500
      background: '#F0F9FF', // sky-50
      description: 'Calm and modern sky blue theme'
    },
    {
      name: 'Default',
      value: 'default',
      primary: '#3B82F6', // blue-500
      background: '#FFFFFF',
      description: 'Original Hisab Kitab theme'
    }
  ];

  const currentColorTheme = localStorage.getItem('color-theme') || 'default';

  const handleColorThemeChange = (colorTheme: string) => {
    localStorage.setItem('color-theme', colorTheme);
    
    // Apply the color theme to the document root
    const root = document.documentElement;
    
    switch (colorTheme) {
      case 'green':
        root.style.setProperty('--primary', '142 69% 58%'); // emerald-500 in HSL
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '142 76% 36%'); // emerald-600
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '142 69% 58%');
        root.style.setProperty('--sidebar-accent', '142 76% 36%');
        break;
      case 'grey':
        root.style.setProperty('--primary', '220 9% 46%'); // gray-600 in HSL
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '220 13% 69%'); // gray-400
        root.style.setProperty('--accent-foreground', '220 9% 46%');
        root.style.setProperty('--sidebar-background', '220 9% 46%');
        root.style.setProperty('--sidebar-accent', '220 13% 69%');
        break;
      case 'sky':
        root.style.setProperty('--primary', '199 89% 48%'); // sky-500 in HSL
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '198 93% 60%'); // sky-400
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '199 89% 48%');
        root.style.setProperty('--sidebar-accent', '198 93% 60%');
        break;
      default:
        // Reset to default values
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--accent', '221.2 83.2% 53.3%');
        root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
        root.style.setProperty('--sidebar-background', '221.2 83.2% 53.3%');
        root.style.setProperty('--sidebar-accent', '217 91.2% 59.8%');
        break;
    }
    
    // Force a re-render to apply changes immediately
    window.dispatchEvent(new Event('storage'));
  };

  // Apply saved theme on component mount
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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Dark/Light Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Display Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center gap-2"
              >
                {theme === 'light' && <Check className="h-4 w-4" />}
                Light Mode
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center gap-2"
              >
                {theme === 'dark' && <Check className="h-4 w-4" />}
                Dark Mode
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex items-center gap-2"
              >
                {theme === 'system' && <Check className="h-4 w-4" />}
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorThemes.map((colorTheme) => (
                <div
                  key={colorTheme.value}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    currentColorTheme === colorTheme.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleColorThemeChange(colorTheme.value)}
                >
                  {currentColorTheme === colorTheme.value && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: colorTheme.primary }}
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {colorTheme.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {colorTheme.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview Colors */}
                  <div className="flex gap-1 mt-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: colorTheme.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: colorTheme.background }}
                    />
                    <div className="w-4 h-4 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                <h3 className="font-semibold">Primary Color Sample</h3>
                <p className="text-sm opacity-90">This shows how primary elements will appear</p>
              </div>
              
              <div className="p-4 bg-accent text-accent-foreground rounded-lg">
                <h3 className="font-semibold">Accent Color Sample</h3>
                <p className="text-sm opacity-90">This shows how accent elements will appear</p>
              </div>
              
              <div className="flex gap-2">
                <Button>Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="secondary">Secondary Button</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default ThemeSettings;
