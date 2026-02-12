import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard,
  Globe, 
  BarChart3, 
  ChevronDown,
  ChevronRight,
  PiggyBank,
  AlertCircle,
  FilePen,
  Copy,
  FileText,
  Users,
  Calculator,
  Landmark,
  BookOpen,
  Printer,
  HeadphonesIcon,
  Settings,
  UserCog,
  Palette,
  Shield,
  Home,
  Wallet
} from 'lucide-react';
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
}

interface SidebarSubMenuProps {
  items: {
    icon: JSX.Element;
    label: string;
    to: string;
  }[];
  isExpanded: boolean;
}

const SidebarSubMenu = ({ items, isExpanded }: SidebarSubMenuProps) => {
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
  onClick 
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

const Sidebar = () => {
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

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Admin submenu items
  const adminItems = [
    { icon: <UserCog size={16} />, label: 'User Admin', to: '/user-admin' },
    { icon: <Palette size={16} />, label: 'Theme Settings', to: '/theme-settings' },
    { icon: <Printer size={16} />, label: 'Print', to: '/downloads' },
  ];

  // Household submenu items
  const householdItems = [
    { icon: <FileText size={16} />, label: 'Milk', to: '/milk' },
    { icon: <FileText size={16} />, label: 'Misc Expenses', to: '/misc-expenses' },
    { icon: <PiggyBank size={16} />, label: 'Money (Udhar)', to: '/udhar' },
  ];

  // Financial Services submenu items
  const financialServiceItems = [
    { icon: <CreditCard size={16} />, label: 'Banking Transaction', to: '/banking' },
    { icon: <PiggyBank size={16} />, label: 'OD Records', to: '/od-records' },
  ];

  // Non Financial Services submenu items
  const nonFinancialServiceItems = [
    { icon: <Landmark size={16} />, label: 'Accounts Opened', to: '/banking-accounts' },
    { icon: <Users size={16} />, label: 'Account Details', to: '/account-details' },
    { icon: <Shield size={16} />, label: 'Social Security', to: '/social-security' },
    
  ];

  // Customer Services submenu items
  const customerServiceItems = [
    { icon: <Globe size={16} />, label: 'Digital Services', to: '/online-services' },
    { icon: <FilePen size={16} />, label: 'Offline Services', to: '/applications' },
    { icon: <Copy size={16} />, label: 'Print / Photostat', to: '/photostat' },
  ];

  // Apps submenu items
  const appsItems = [
    { icon: <Calculator size={16} />, label: 'Calculator', to: '/calculator' },
    { icon: <Calculator size={16} />, label: 'Age Calculator', to: '/age-calculator' },
    { icon: <FileText size={16} />, label: 'Forms', to: '/forms' },
  ];

  // Ledger submenu items
  const ledgerItems = [
    { icon: <BookOpen size={16} />, label: 'Khata', to: '/khata' },
    { icon: <FileText size={16} />, label: 'Papers', to: '/papers' },
    { icon: <AlertCircle size={16} />, label: 'Pending Balance', to: '/pending-balance' },
    { icon: <PiggyBank size={16} />, label: 'Expenses', to: '/expenses' },
  ];

  // Main sidebar items
  const sidebarItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', to: '/', hasChildren: false },
    { icon: <CreditCard size={18} />, label: 'Financial Services', to: '#', hasChildren: true, menuKey: 'financialServices', children: financialServiceItems },
    { icon: <Landmark size={18} />, label: 'Non Financial Services', to: '#', hasChildren: true, menuKey: 'nonFinancialServices', children: nonFinancialServiceItems },
    { icon: <HeadphonesIcon size={18} />, label: 'Customer Services', to: '#', hasChildren: true, menuKey: 'customerServices', children: customerServiceItems },
    { icon: <BookOpen size={18} />, label: 'Ledger', to: '#', hasChildren: true, menuKey: 'ledger', children: ledgerItems },
    { icon: <Calculator size={18} />, label: 'Apps', to: '#', hasChildren: true, menuKey: 'apps', children: appsItems },
    { icon: <BarChart3 size={18} />, label: 'Analytics', to: '/analytics', hasChildren: false },
    { icon: <Home size={18} />, label: 'Household', to: '#', hasChildren: true, menuKey: 'household', children: householdItems },
    { icon: <Settings size={18} />, label: 'Admin', to: '#', hasChildren: true, menuKey: 'admin', children: adminItems },
  ];

  return (
    <aside className="h-screen w-72 flex flex-col sticky top-0 p-3">
      {/* Main Sidebar Container with theme colors */}
      <div className="flex-1 rounded-3xl shadow-xl flex flex-col overflow-hidden border transition-colors duration-300 bg-sidebar border-sidebar-border shadow-primary/20">
        {/* Header with Avatar */}
        <div className="p-5 border-b transition-colors duration-300 border-sidebar-border/50">
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
        </div>

        {/* Menu Label */}
        <div className="px-5 pt-4 pb-2">
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
                  />
                  
                  {item.hasChildren && (
                    <SidebarSubMenu
                      items={item.children ?? []}
                      isExpanded={expandedMenus[item.menuKey as string]}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
};

export default Sidebar;