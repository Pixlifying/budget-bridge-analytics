import React, { useState } from 'react';
import {
  HomeIcon,
  Calculator,
  CreditCard,
  Passport,
  Landmark,
  Globe,
  Files,
  Copy,
  Users,
  DollarSign,
  FileCheck,
  HelpCircle,
  BarChart4,
  User2,
  CircleDollarSign,
  Receipt,
  FileBox,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface NavSubItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface NavGroupProps {
  icon: React.ReactNode;
  label: string;
  subItems: NavSubItemProps[];
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <li>
      <NavLink
        to={href}
        className={cn(
          'flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground',
          isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'
        )}
      >
        {icon}
        {label}
      </NavLink>
    </li>
  );
};

const NavSubItem: React.FC<NavSubItemProps> = ({ href, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <li>
      <NavLink
        to={href}
        className={cn(
          'flex items-center gap-2 rounded-md p-2 pl-6 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground',
          isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'
        )}
      >
        {icon}
        {label}
      </NavLink>
    </li>
  );
};

const NavGroup: React.FC<NavGroupProps> = ({ icon, label, subItems }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <li>
      <button
        className="flex w-full items-center justify-between gap-2 rounded-md p-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          {label}
        </div>
        <svg
          className={cn('h-4 w-4 shrink-0 transition-transform duration-200', {
            'rotate-90': isExpanded,
          })}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      {isExpanded && (
        <ul className="mt-2 space-y-1">
          {subItems.map((subItem) => (
            <NavSubItem key={subItem.href} href={subItem.href} icon={subItem.icon} label={subItem.label} />
          ))}
        </ul>
      )}
    </li>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const links = [
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
    { href: '/passport', icon: <Passport />, label: 'Passport' },
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

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col w-64 border-r bg-secondary text-secondary-foreground',
          !isSidebarOpen ? 'hidden' : 'block'
        )}
      >
        <div className="p-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <ul>
            {links.map((link, index) =>
              link.subItems ? (
                <NavGroup key={index} icon={link.icon} label={link.label} subItems={link.subItems} />
              ) : (
                <NavItem key={link.href} href={link.href} icon={link.icon} label={link.label} />
              )
            )}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Your main content here */}
      </div>
    </div>
  );
};

export default Sidebar;
