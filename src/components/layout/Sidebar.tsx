
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  CreditCard,
  Globe,
  FileText,
  BarChart3,
  Receipt,
  Users,
  Calculator,
  Printer,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Banknote,
  DollarSign,
  Clock,
  User,
  UserCog,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Banking Services', href: '/banking-services', icon: CreditCard },
    { name: 'Banking Accounts', href: '/banking-accounts', icon: Banknote },
    { name: 'Over Draft', href: '/od', icon: DollarSign },
    { name: 'Online Services', href: '/online-services', icon: Globe },
    { name: 'Applications', href: '/applications', icon: FileText },
    { name: 'Photostat', href: '/photostat', icon: Printer },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Misc Expenses', href: '/misc-expenses', icon: Receipt },
    { name: 'Pending Balance', href: '/pending-balance', icon: Clock },
    { name: 'Ledger', href: '/ledger', icon: BookOpen },
    { name: 'Account Details', href: '/account-details', icon: Users },
    { name: 'Khata', href: '/khata', icon: BookOpen },
    { name: 'Papers', href: '/papers', icon: FileText },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'Age Calculator', href: '/age-calculator', icon: Calculator },
    { name: 'Print Templates', href: '/print-templates', icon: Printer },
    { name: 'Downloads', href: '/downloads', icon: Settings },
    { name: 'Query', href: '/query', icon: FileText },
    { name: 'User Admin', href: '/user-admin', icon: UserCog },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-16 lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto h-8 w-8 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4 lg:p-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  isActive(item.href) && 'bg-muted text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && item.name}
                {isActive(item.href) && !collapsed && (
                  <Badge variant="secondary" className="ml-auto">
                    Active
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
      <div className="mt-auto">
        <Separator />
        <div className="p-4 lg:p-6">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && 'Collapse'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-background border-r">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:block border-r bg-background",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
