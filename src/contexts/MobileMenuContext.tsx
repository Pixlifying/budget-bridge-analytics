import { createContext, useContext } from 'react';

interface MobileMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const MobileMenuContext = createContext<MobileMenuContextType>({
  open: false,
  setOpen: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);
