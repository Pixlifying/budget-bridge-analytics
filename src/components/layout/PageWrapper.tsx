
import { ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}

const PageWrapper = ({ title, subtitle, action, children, icon }: PageWrapperProps) => {
  return (
    <div className="page-transition">
      <header className="sticky top-0 z-40 bg-sidebar px-4 py-3 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-sidebar-foreground">{icon}</div>}
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">{title}</h1>
              {subtitle && <p className="text-sidebar-foreground/70">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="mt-4 md:mt-0 text-sidebar-foreground">{action}</div>}
        </div>
      </header>
      <main className="px-6 md:px-8 pb-8">{children}</main>
    </div>
  );
};

export default PageWrapper;
