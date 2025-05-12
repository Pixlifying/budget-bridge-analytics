
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard,
  Globe, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  AlertCircle,
  FilePen,
  Copy,
  FileText,
  Users,
  Calculator,
  ChevronsRight,
  ChevronsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarItemProps {
  icon: JSX.Element;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

// SubMenu component for nested items
interface SidebarSubMenuProps {
  items: {
    icon: JSX.Element;
    label: string;
    to: string;
  }[];
  isCollapsed: boolean;
  isExpanded: boolean;
}

const SidebarSubMenu = ({ items, isCollapsed, isExpanded }: SidebarSubMenuProps) => {
  const location = useLocation();
  
  if (isCollapsed || !isExpanded) return null;
  
  return (
    <div className="ml-6 mt-1 border-l border-sidebar-border pl-2 space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.to || location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all duration-300 ease-in-out",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="shrink-0 w-4 h-4">
              {item.icon}
            </div>
            <span className="text-sm font-medium">{item.label}</span>
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
  isCollapsed, 
  hasChildren, 
  isExpanded,
  onClick 
}: SidebarItemProps) => {
  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={onClick}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-3 my-1 rounded-md transition-all duration-300 ease-in-out",
            isActive 
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
              : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className={cn("shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")}>
            {icon}
          </div>
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium flex-1 text-left">{label}</span>
              {!isCollapsed && (isExpanded ? <ChevronsDown size={16} /> : <ChevronsRight size={16} />)}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-3 my-1 rounded-md transition-all duration-300 ease-in-out",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
          : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <div className={cn("shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")}>
        {icon}
      </div>
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    services: false,
    expenses: false,
  });

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Service submenu items
  const serviceItems = [
    {
      icon: <CreditCard size={isCollapsed ? 20 : 16} />,
      label: 'Banking Services',
      to: '/banking-services',
    },
    {
      icon: <Globe size={isCollapsed ? 20 : 16} />,
      label: 'Digital Services',
      to: '/online-services',
    },
    {
      icon: <FilePen size={isCollapsed ? 20 : 16} />,
      label: 'Offline Services',
      to: '/applications',
    },
  ];

  // Expense submenu items
  const expenseItems = [
    {
      icon: <PiggyBank size={isCollapsed ? 20 : 16} />,
      label: 'Expenses',
      to: '/expenses',
    },
    {
      icon: <Copy size={isCollapsed ? 20 : 16} />,
      label: 'Fee Expenses',
      to: '/fee-expenses',
    },
    {
      icon: <FileText size={isCollapsed ? 20 : 16} />,
      label: 'Misc Expenses',
      to: '/misc-expenses',
    },
  ];

  // Main sidebar items
  const sidebarItems = [
    {
      icon: <LayoutDashboard size={isCollapsed ? 20 : 18} />,
      label: 'Dashboard',
      to: '/',
      hasChildren: false,
    },
    {
      icon: <CreditCard size={isCollapsed ? 20 : 18} />,
      label: 'Services',
      to: '#',
      hasChildren: true,
      menuKey: 'services',
      children: serviceItems,
    },
    {
      icon: <Copy size={isCollapsed ? 20 : 18} />,
      label: 'Photostat',
      to: '/photostat',
      hasChildren: false,
    },
    {
      icon: <FileText size={isCollapsed ? 20 : 18} />,
      label: 'Queries',
      to: '/queries',
      hasChildren: false,
    },
    {
      icon: <Users size={isCollapsed ? 20 : 18} />,
      label: 'Customers',
      to: '/customers',
      hasChildren: false,
    },
    {
      icon: <AlertCircle size={isCollapsed ? 20 : 18} />,
      label: 'Pending Balance',
      to: '/pending-balance',
      hasChildren: false,
    },
    {
      icon: <Calculator size={isCollapsed ? 20 : 18} />,
      label: 'Age Calculator',
      to: '/age-calculator',
      hasChildren: false,
    },
    {
      icon: <BarChart3 size={isCollapsed ? 20 : 18} />,
      label: 'Analytics',
      to: '/analytics',
      hasChildren: false,
    },
    {
      icon: <PiggyBank size={isCollapsed ? 20 : 18} />,
      label: 'Expenses',
      to: '#',
      hasChildren: true,
      menuKey: 'expenses',
      children: expenseItems,
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">Hisab Kitab</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-full bg-sidebar-accent/10 text-sidebar-foreground hover:bg-sidebar-accent/20 transition-all"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            // Calculate if this item or any of its children is active
            const isActive = item.hasChildren 
              ? (item.children?.some(child => location.pathname === child.to || location.pathname.startsWith(child.to))) ?? false
              : (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to));
            
            return (
              <div key={item.label}>
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  to={item.hasChildren ? '#' : item.to}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  hasChildren={item.hasChildren}
                  isExpanded={item.hasChildren ? expandedMenus[item.menuKey as string] : undefined}
                  onClick={item.hasChildren ? () => toggleMenu(item.menuKey as string) : undefined}
                />
                
                {item.hasChildren && (
                  <SidebarSubMenu
                    items={item.children ?? []}
                    isCollapsed={isCollapsed}
                    isExpanded={expandedMenus[item.menuKey as string]}
                  />
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
