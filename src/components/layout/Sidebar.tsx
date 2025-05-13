import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home as HomeIcon, 
  Menu, 
  X, 
  CreditCard, 
  Globe, 
  Landmark, 
  Files, 
  Copy, 
  Users, 
  FileCheck, 
  HelpCircle, 
  BarChart4,
  DollarSign, 
  CircleDollarSign, 
  Receipt, 
  FileBox,
  Calculator,
  User2,
  BookOpen // Replacing Passport with BookOpen
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface NavItem {
  href?: string;
  icon: JSX.Element;
  label: string;
  subItems?: NavSubItem[];
}

interface NavSubItem {
  href: string;
  icon: JSX.Element;
  label: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [activeItems, setActiveItems] = useState<string[]>([]);

  const links: NavItem[] = [
    { href: '/', icon: <HomeIcon />, label: 'Dashboard' },
    { 
      icon: <Calculator />, 
      label: 'Apps',
      subItems: [
        { href: '/calculator', icon: <Calculator />, label: 'Calculator' },
        { href: '/age-calculator', icon: <User2 />, label: 'Age Calculator' },
      ]
    },
    { href: '/pan-card', icon: <CreditCard />, label: 'Pan Card' },
    { href: '/passport', icon: <BookOpen />, label: 'Passport' }, // Using BookOpen instead of Passport
    { href: '/banking-services', icon: <Landmark />, label: 'Banking' },
    { href: '/online-services', icon: <Globe />, label: 'Online Services' },
    { href: '/applications', icon: <Files />, label: 'Applications' },
    { href: '/photostat', icon: <Copy />, label: 'Photostat' },
    { href: '/customers', icon: <Users />, label: 'Customers' },
    { 
      icon: <DollarSign />, 
      label: 'Expenses',
      subItems: [
        { href: '/expenses', icon: <CircleDollarSign />, label: 'General Expenses' },
        { href: '/fee-expenses', icon: <Receipt />, label: 'Fee Expenses' },
        { href: '/misc-expenses', icon: <FileBox />, label: 'Misc Expenses' },
      ]
    },
    { href: '/pending-balance', icon: <FileCheck />, label: 'Pending Balance' },
    { href: '/queries', icon: <HelpCircle />, label: 'Query' },
    { href: '/analytics', icon: <BarChart4 />, label: 'Analytics' },
  ];

  useEffect(() => {
    // Find which main item and submenu item should be active based on current path
    const currentPath = location.pathname;
    const newActiveItems: string[] = [];
    
    links.forEach(item => {
      if (item.href && currentPath === item.href) {
        newActiveItems.push(item.label);
      } else if (item.subItems) {
        const activeSubItem = item.subItems.find(subItem => subItem.href === currentPath);
        if (activeSubItem) {
          newActiveItems.push(item.label);
        }
      }
    });
    
    setActiveItems(newActiveItems);
  }, [location.pathname]);

  const toggleSubMenu = (label: string) => {
    setActiveItems(prev => {
      if (prev.includes(label)) {
        return prev.filter(item => item !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  const handleLinkClick = () => {
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-full w-64 transition-all duration-300 ease-in-out bg-white border-r shadow-sm",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h2 className="font-semibold text-lg">GAMA Finance</h2>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {links.map((item, index) => (
            <div key={index} className="space-y-1">
              {item.href ? (
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                    isActive
                      ? "bg-purple-50 text-purple-600"
                      : "text-slate-700 hover:bg-purple-50 hover:text-purple-600",
                  )}
                  onClick={handleLinkClick}
                >
                  <span className="mr-3 h-5 w-5">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium",
                      activeItems.includes(item.label)
                        ? "bg-purple-50 text-purple-600"
                        : "text-slate-700 hover:bg-purple-50 hover:text-purple-600",
                    )}
                    onClick={() => toggleSubMenu(item.label)}
                  >
                    <span className="flex items-center">
                      <span className="mr-3 h-5 w-5">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        activeItems.includes(item.label) ? "rotate-180" : ""
                      )}
                    >
                      {/* Chevron icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </Button>
                  
                  <div
                    className={cn(
                      "pl-8 mt-1 space-y-1",
                      activeItems.includes(item.label) ? "block" : "hidden"
                    )}
                  >
                    {item.subItems?.map((subItem, subIndex) => (
                      <NavLink
                        key={subIndex}
                        to={subItem.href}
                        className={({ isActive }) => cn(
                          "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                          isActive
                            ? "bg-purple-50 text-purple-600"
                            : "text-slate-700 hover:bg-purple-50 hover:text-purple-600",
                        )}
                        onClick={handleLinkClick}
                      >
                        <span className="mr-3 h-4 w-4">{subItem.icon}</span>
                        <span>{subItem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
