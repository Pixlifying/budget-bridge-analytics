
import { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}

const PageWrapper = ({ title, subtitle, action, children, icon }: PageWrapperProps) => {
  const { setOpen } = useMobileMenu();

  return (
    <div className="page-transition">
      <header className="sticky top-0 z-40 bg-sidebar px-4 sm:px-5 py-3 mb-6 mx-2 sm:mx-4 mt-2 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setOpen(true)} 
              className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground shrink-0"
            >
              <Menu size={20} />
            </button>
            {icon && <div className="text-sidebar-foreground shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-sidebar-foreground truncate">{title}</h1>
              {subtitle && <p className="text-sidebar-foreground/70 text-sm truncate">{subtitle}</p>}
            </div>
          </div>
          {action && (
            <div className="text-sidebar-foreground [&_button]:bg-sidebar-accent [&_button]:text-sidebar-accent-foreground [&_button]:border-sidebar-border [&_select]:bg-sidebar-accent [&_select]:text-sidebar-accent-foreground [&_select]:border-sidebar-border [&_[role=combobox]]:bg-sidebar-accent [&_[role=combobox]]:text-sidebar-accent-foreground [&_[role=combobox]]:border-sidebar-border">
              {action}
            </div>
          )}
        </div>
      </header>
      <main className="px-3 sm:px-6 md:px-8 pb-8">{children}</main>
    </div>
  );
};

export default PageWrapper;
