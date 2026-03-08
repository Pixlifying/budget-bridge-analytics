import { createContext, useContext } from 'react';

interface MobileMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const MobileMenuContext = createContext<MobileMenuContextType>({
  open: false,
  setOpen: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);
