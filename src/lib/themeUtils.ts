
export const applyColorTheme = (colorTheme: string) => {
  const root = document.documentElement;
  
  // Theme color definitions with gradient backgrounds
  const themes: Record<string, {
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    sidebarBackground: string;
    sidebarAccent: string;
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
  }> = {
    default: {
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      accent: '217 91.2% 59.8%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '221.2 83.2% 53.3%',
      sidebarAccent: '217 91.2% 59.8%',
      gradientFrom: '240 20% 97%',
      gradientVia: '235 25% 95%',
      gradientTo: '230 20% 97%',
    },
    green: {
      primary: '142 69% 58%',
      primaryForeground: '0 0% 100%',
      accent: '142 76% 36%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '142 69% 58%',
      sidebarAccent: '142 76% 36%',
      gradientFrom: '142 30% 97%',
      gradientVia: '145 35% 95%',
      gradientTo: '140 30% 97%',
    },
    black: {
      primary: '215 28% 17%',
      primaryForeground: '0 0% 100%',
      accent: '215 20% 27%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '215 28% 17%',
      sidebarAccent: '215 20% 27%',
      gradientFrom: '215 15% 97%',
      gradientVia: '220 20% 95%',
      gradientTo: '210 15% 97%',
    },
    gold: {
      primary: '32 94% 43%',
      primaryForeground: '0 0% 100%',
      accent: '38 92% 50%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '32 94% 43%',
      sidebarAccent: '38 92% 50%',
      gradientFrom: '40 40% 97%',
      gradientVia: '35 45% 95%',
      gradientTo: '45 40% 97%',
    },
    rosegold: {
      primary: '13 66% 62%',
      primaryForeground: '0 0% 100%',
      accent: '29 79% 68%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '13 66% 62%',
      sidebarAccent: '29 79% 68%',
      gradientFrom: '15 40% 97%',
      gradientVia: '20 45% 95%',
      gradientTo: '10 40% 97%',
    },
    yellow: {
      primary: '47 96% 53%',
      primaryForeground: '24 9% 10%',
      accent: '54 96% 64%',
      accentForeground: '24 9% 10%',
      sidebarBackground: '47 96% 53%',
      sidebarAccent: '54 96% 64%',
      gradientFrom: '50 50% 97%',
      gradientVia: '55 55% 95%',
      gradientTo: '45 50% 97%',
    },
    indigo: {
      primary: '239 84% 67%',
      primaryForeground: '0 0% 100%',
      accent: '243 75% 69%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '239 84% 67%',
      sidebarAccent: '243 75% 69%',
      gradientFrom: '240 40% 97%',
      gradientVia: '245 45% 95%',
      gradientTo: '235 40% 97%',
    },
    emerald: {
      primary: '160 84% 39%',
      primaryForeground: '0 0% 100%',
      accent: '158 64% 52%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '160 84% 39%',
      sidebarAccent: '158 64% 52%',
      gradientFrom: '160 35% 97%',
      gradientVia: '165 40% 95%',
      gradientTo: '155 35% 97%',
    },
    cyan: {
      primary: '188 94% 43%',
      primaryForeground: '0 0% 100%',
      accent: '186 94% 59%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '188 94% 43%',
      sidebarAccent: '186 94% 59%',
      gradientFrom: '190 40% 97%',
      gradientVia: '195 45% 95%',
      gradientTo: '185 40% 97%',
    },
    lime: {
      primary: '84 81% 44%',
      primaryForeground: '0 0% 100%',
      accent: '83 78% 56%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '84 81% 44%',
      sidebarAccent: '83 78% 56%',
      gradientFrom: '85 40% 97%',
      gradientVia: '90 45% 95%',
      gradientTo: '80 40% 97%',
    },
    amber: {
      primary: '38 92% 50%',
      primaryForeground: '0 0% 100%',
      accent: '48 96% 58%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '38 92% 50%',
      sidebarAccent: '48 96% 58%',
      gradientFrom: '40 45% 97%',
      gradientVia: '45 50% 95%',
      gradientTo: '35 45% 97%',
    },
    fuchsia: {
      primary: '292 84% 61%',
      primaryForeground: '0 0% 100%',
      accent: '291 64% 72%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '292 84% 61%',
      sidebarAccent: '291 64% 72%',
      gradientFrom: '295 40% 97%',
      gradientVia: '290 45% 95%',
      gradientTo: '300 40% 97%',
    },
    crimson: {
      primary: '0 84% 60%',
      primaryForeground: '0 0% 100%',
      accent: '0 72% 51%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '0 84% 60%',
      sidebarAccent: '0 72% 51%',
      gradientFrom: '0 35% 97%',
      gradientVia: '355 40% 95%',
      gradientTo: '5 35% 97%',
    },
    navy: {
      primary: '219 79% 32%',
      primaryForeground: '0 0% 100%',
      accent: '221 83% 53%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '219 79% 32%',
      sidebarAccent: '221 83% 53%',
      gradientFrom: '220 30% 97%',
      gradientVia: '225 35% 95%',
      gradientTo: '215 30% 97%',
    },
    mint: {
      primary: '173 80% 40%',
      primaryForeground: '0 0% 100%',
      accent: '172 82% 57%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '173 80% 40%',
      sidebarAccent: '172 82% 57%',
      gradientFrom: '175 35% 97%',
      gradientVia: '170 40% 95%',
      gradientTo: '180 35% 97%',
    },
    coral: {
      primary: '0 77% 72%',
      primaryForeground: '0 0% 100%',
      accent: '0 86% 80%',
      accentForeground: '0 72% 51%',
      sidebarBackground: '0 77% 72%',
      sidebarAccent: '0 86% 80%',
      gradientFrom: '5 40% 97%',
      gradientVia: '0 45% 95%',
      gradientTo: '355 40% 97%',
    },
    lavender: {
      primary: '256 58% 76%',
      primaryForeground: '0 0% 100%',
      accent: '262 68% 84%',
      accentForeground: '262 83% 58%',
      sidebarBackground: '256 58% 76%',
      sidebarAccent: '262 68% 84%',
      gradientFrom: '260 45% 97%',
      gradientVia: '255 50% 95%',
      gradientTo: '265 45% 97%',
    },
    slate: {
      primary: '215 20% 40%',
      primaryForeground: '0 0% 100%',
      accent: '215 16% 47%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '215 20% 40%',
      sidebarAccent: '215 16% 47%',
      gradientFrom: '215 15% 97%',
      gradientVia: '220 20% 95%',
      gradientTo: '210 15% 97%',
    },
    violet: {
      primary: '262 83% 58%',
      primaryForeground: '0 0% 100%',
      accent: '258 90% 66%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '262 83% 58%',
      sidebarAccent: '258 90% 66%',
      gradientFrom: '265 40% 97%',
      gradientVia: '260 45% 95%',
      gradientTo: '270 40% 97%',
    },
    pink: {
      primary: '330 81% 60%',
      primaryForeground: '0 0% 100%',
      accent: '330 77% 72%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '330 81% 60%',
      sidebarAccent: '330 77% 72%',
      gradientFrom: '335 40% 97%',
      gradientVia: '330 45% 95%',
      gradientTo: '340 40% 97%',
    },
    bronze: {
      primary: '30 83% 34%',
      primaryForeground: '0 0% 100%',
      accent: '42 78% 32%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '30 83% 34%',
      sidebarAccent: '42 78% 32%',
      gradientFrom: '35 30% 97%',
      gradientVia: '30 35% 95%',
      gradientTo: '40 30% 97%',
    },
    sapphire: {
      primary: '202 96% 27%',
      primaryForeground: '0 0% 100%',
      accent: '199 89% 48%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '202 96% 27%',
      sidebarAccent: '199 89% 48%',
      gradientFrom: '205 40% 97%',
      gradientVia: '200 45% 95%',
      gradientTo: '210 40% 97%',
    },
    grey: {
      primary: '220 9% 46%',
      primaryForeground: '0 0% 100%',
      accent: '220 13% 69%',
      accentForeground: '220 9% 46%',
      sidebarBackground: '220 9% 46%',
      sidebarAccent: '220 13% 69%',
      gradientFrom: '220 10% 97%',
      gradientVia: '225 15% 95%',
      gradientTo: '215 10% 97%',
    },
    sky: {
      primary: '199 89% 48%',
      primaryForeground: '0 0% 100%',
      accent: '198 93% 60%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '199 89% 48%',
      sidebarAccent: '198 93% 60%',
      gradientFrom: '200 45% 97%',
      gradientVia: '195 50% 95%',
      gradientTo: '205 45% 97%',
    },
    purple: {
      primary: '262 83% 58%',
      primaryForeground: '0 0% 100%',
      accent: '262 68% 70%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '262 83% 58%',
      sidebarAccent: '262 68% 70%',
      gradientFrom: '265 40% 97%',
      gradientVia: '260 45% 95%',
      gradientTo: '270 40% 97%',
    },
    rose: {
      primary: '347 77% 50%',
      primaryForeground: '0 0% 100%',
      accent: '347 89% 60%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '347 77% 50%',
      sidebarAccent: '347 89% 60%',
      gradientFrom: '350 40% 97%',
      gradientVia: '345 45% 95%',
      gradientTo: '355 40% 97%',
    },
    orange: {
      primary: '20 91% 48%',
      primaryForeground: '0 0% 100%',
      accent: '20 91% 67%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '20 91% 48%',
      sidebarAccent: '20 91% 67%',
      gradientFrom: '25 45% 97%',
      gradientVia: '20 50% 95%',
      gradientTo: '30 45% 97%',
    },
    teal: {
      primary: '172 66% 50%',
      primaryForeground: '0 0% 100%',
      accent: '172 44% 37%',
      accentForeground: '0 0% 100%',
      sidebarBackground: '172 66% 50%',
      sidebarAccent: '172 44% 37%',
      gradientFrom: '175 40% 97%',
      gradientVia: '170 45% 95%',
      gradientTo: '180 40% 97%',
    },
  };
  
  const theme = themes[colorTheme] || themes.default;
  
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-foreground', theme.primaryForeground);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-foreground', theme.accentForeground);
  root.style.setProperty('--sidebar-background', theme.sidebarBackground);
  root.style.setProperty('--sidebar-accent', theme.sidebarAccent);
  root.style.setProperty('--theme-gradient-from', theme.gradientFrom);
  root.style.setProperty('--theme-gradient-via', theme.gradientVia);
  root.style.setProperty('--theme-gradient-to', theme.gradientTo);
  root.style.setProperty('--ring', theme.primary);
};

export const setColorTheme = (colorTheme: string) => {
  localStorage.setItem('color-theme', colorTheme);
  applyColorTheme(colorTheme);
  window.dispatchEvent(new Event('storage'));
};

export const getColorTheme = () => {
  return localStorage.getItem('color-theme') || 'default';
};
