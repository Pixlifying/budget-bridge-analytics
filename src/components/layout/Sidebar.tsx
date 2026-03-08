import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import {
  IconDashboard,
  IconWallet,
  IconBank,
  IconPiggy,
  IconShield,
  IconUsers,
  IconDocument,
  IconFingerprint,
  IconGlobe,
  IconPrint,
  IconPaper,
  IconBook,
  IconPalette,
  IconChart,
  IconHome,
  IconSettings,
  IconUserAdmin,
  IconCalculator,
  IconPen,
  IconWarning,
  IconMoney,
  IconExpense,
  IconForms,
  IconMilk,
  IconBankingTransaction,
  IconBankAccounts,
  IconAgeCalc,
} from '@/components/icons/IconoirIcons';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarItemProps {
  icon: JSX.Element;
  label: string;
  to: string;
  isActive: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  onNavigate?: () => void;
}

interface SidebarSubMenuProps {
  items: {
    icon: JSX.Element;
    label: string;
    to: string;
  }[];
  isExpanded: boolean;
  onNavigate?: () => void;
}

const SidebarSubMenu = ({ items, isExpanded, onNavigate }: SidebarSubMenuProps) => {
  const location = useLocation();
  
  if (!isExpanded) return null;
  
  return (
    <div className="ml-8 mt-1 space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.to || location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
              isActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="shrink-0 w-4 h-4">
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

const SidebarItem = ({ 
  icon, 
  label, 
  to, 
  isActive, 
  hasChildren, 
  isExpanded,
  onClick,
  onNavigate
}: SidebarItemProps) => {
  if (hasChildren) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30" 
            : "text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="shrink-0 w-5 h-5">
          {icon}
        </div>
        <span className="text-sm font-medium flex-1 text-left">{label}</span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
        isActive 
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30" 
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <div className="shrink-0 w-5 h-5">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    admin: false,
    financialServices: false,
    nonFinancialServices: false,
    customerServices: false,
    ledger: false,
    apps: false,
    household: false
  });

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  }, [location.pathname]);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const adminItems = [
    { icon: <IconUserAdmin size={16} />, label: 'User Admin', to: '/user-admin' },
    { icon: <IconPalette size={16} />, label: 'Theme Settings', to: '/theme-settings' },
    { icon: <IconPrint size={16} />, label: 'Print', to: '/downloads' },
  ];

  const householdItems = [
    { icon: <IconMilk size={16} />, label: 'Milk', to: '/milk' },
    { icon: <IconExpense size={16} />, label: 'Misc Expenses', to: '/misc-expenses' },
    { icon: <IconMoney size={16} />, label: 'Money (Udhar)', to: '/udhar' },
  ];

  const financialServiceItems = [
    { icon: <IconBankingTransaction size={16} />, label: 'Banking Transaction', to: '/banking' },
    { icon: <IconPiggy size={16} />, label: 'OD Records', to: '/od-records' },
  ];

  const nonFinancialServiceItems = [
    { icon: <IconBankAccounts size={16} />, label: 'Accounts Opened', to: '/banking-accounts' },
    { icon: <IconUsers size={16} />, label: 'Account Details', to: '/account-details' },
    { icon: <IconShield size={16} />, label: 'Social Security', to: '/social-security' },
    { icon: <IconDocument size={16} />, label: 'Documentation', to: '/documentation' },
  ];

  const customerServiceItems = [
    { icon: <IconGlobe size={16} />, label: 'Digital Services', to: '/online-services' },
    { icon: <IconPen size={16} />, label: 'Offline Services', to: '/applications' },
    { icon: <IconPrint size={16} />, label: 'Print / Photostat', to: '/photostat' },
  ];

  const appsItems = [
    { icon: <IconCalculator size={16} />, label: 'Calculator', to: '/calculator' },
    { icon: <IconAgeCalc size={16} />, label: 'Age Calculator', to: '/age-calculator' },
    { icon: <IconForms size={16} />, label: 'Forms', to: '/forms' },
  ];

  const ledgerItems = [
    { icon: <IconBook size={16} />, label: 'Khata', to: '/khata' },
    { icon: <IconPaper size={16} />, label: 'Papers', to: '/papers' },
    { icon: <IconWarning size={16} />, label: 'Pending Balance', to: '/pending-balance' },
    { icon: <IconExpense size={16} />, label: 'Expenses', to: '/expenses' },
  ];

  const sidebarItems = [
    { icon: <IconDashboard size={18} />, label: 'Dashboard', to: '/', hasChildren: false },
    { icon: <IconWallet size={18} />, label: 'Financial Services', to: '#', hasChildren: true, menuKey: 'financialServices', children: financialServiceItems },
    { icon: <IconBank size={18} />, label: 'Non Financial Services', to: '#', hasChildren: true, menuKey: 'nonFinancialServices', children: nonFinancialServiceItems },
    { icon: <IconFingerprint size={18} />, label: 'Customer Services', to: '#', hasChildren: true, menuKey: 'customerServices', children: customerServiceItems },
    { icon: <IconBook size={18} />, label: 'Ledger', to: '#', hasChildren: true, menuKey: 'ledger', children: ledgerItems },
    { icon: <IconCalculator size={18} />, label: 'Apps', to: '#', hasChildren: true, menuKey: 'apps', children: appsItems },
    { icon: <IconChart size={18} />, label: 'Analytics', to: '/analytics', hasChildren: false },
    
    { icon: <IconSettings size={18} />, label: 'Admin', to: '#', hasChildren: true, menuKey: 'admin', children: adminItems },
  ];

  const sidebarContent = (
    <div className="flex-1 rounded-3xl shadow-xl flex flex-col overflow-hidden border transition-colors duration-300 bg-sidebar border-sidebar-border shadow-primary/20">
      {/* Header with Avatar */}
      <div className="p-5 border-b transition-colors duration-300 border-sidebar-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-4 ring-sidebar-primary/30">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                HK
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-sidebar-foreground/70">Good Morning</p>
              <h2 className="font-semibold text-sidebar-foreground">Hisab Kitab</h2>
            </div>
          </div>
          {/* Close button only on mobile */}
          <button 
            onClick={onMobileClose} 
            className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          >
            <X size={20} />
          </button>
        </div>
      </div>


      {/* Menu Label */}
      <div className="px-5 pt-3 pb-2">
        <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">Menu</span>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 pb-4">
          {sidebarItems.map((item) => {
            const isActive = item.hasChildren 
              ? (item.children?.some(child => location.pathname === child.to || location.pathname.startsWith(child.to))) ?? false
              : (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to));
            
            return (
              <div key={item.label}>
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  to={item.hasChildren ? '#' : item.to}
                  isActive={isActive && !item.hasChildren}
                  hasChildren={item.hasChildren}
                  isExpanded={item.hasChildren ? expandedMenus[item.menuKey as string] : undefined}
                  onClick={item.hasChildren ? () => toggleMenu(item.menuKey as string) : undefined}
                  onNavigate={onMobileClose}
                />
                
                {item.hasChildren && (
                  <SidebarSubMenu
                    items={item.children ?? []}
                    isExpanded={expandedMenus[item.menuKey as string]}
                    onNavigate={onMobileClose}
                  />
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-72 flex-col sticky top-0 p-3">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 p-3 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
