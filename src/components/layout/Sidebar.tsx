
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard,
  Globe, 
  BarChart3, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  AlertCircle,
  FilePen,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: JSX.Element;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const SidebarItem = ({ icon, label, to, isActive, isCollapsed }: SidebarItemProps) => {
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

  const sidebarItems = [
    {
      icon: <LayoutDashboard size={isCollapsed ? 20 : 18} />,
      label: 'Dashboard',
      to: '/',
    },
    {
      icon: <FileText size={isCollapsed ? 20 : 18} />,
      label: 'Pan Card',
      to: '/pan-card',
    },
    {
      icon: <Receipt size={isCollapsed ? 20 : 18} />,
      label: 'Passport',
      to: '/passport',
    },
    {
      icon: <CreditCard size={isCollapsed ? 20 : 18} />,
      label: 'Banking Services',
      to: '/banking-services',
    },
    {
      icon: <Globe size={isCollapsed ? 20 : 18} />,
      label: 'Online Services',
      to: '/online-services',
    },
    {
      icon: <FilePen size={isCollapsed ? 20 : 18} />,
      label: 'Applications',
      to: '/applications',
    },
    {
      icon: <Copy size={isCollapsed ? 20 : 18} />,
      label: 'Photostat',
      to: '/photostat',
    },
    {
      icon: <AlertCircle size={isCollapsed ? 20 : 18} />,
      label: 'Pending Balance',
      to: '/pending-balance',
    },
    {
      icon: <BarChart3 size={isCollapsed ? 20 : 18} />,
      label: 'Analytics',
      to: '/analytics',
    },
    {
      icon: <PiggyBank size={isCollapsed ? 20 : 18} />,
      label: 'Expenses',
      to: '/expenses',
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
      
      <div className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={
                item.to === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.to)
              }
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
