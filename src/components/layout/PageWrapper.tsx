
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
          {action && (
            <div className="mt-4 md:mt-0 text-sidebar-foreground [&_button]:bg-sidebar-accent [&_button]:text-sidebar-accent-foreground [&_button]:border-sidebar-border [&_button]:hover:bg-sidebar-accent/80 [&_select]:bg-sidebar-accent [&_select]:text-sidebar-accent-foreground [&_select]:border-sidebar-border [&_[role=combobox]]:bg-sidebar-accent [&_[role=combobox]]:text-sidebar-accent-foreground [&_[role=combobox]]:border-sidebar-border [&_input]:bg-sidebar-accent [&_input]:text-sidebar-accent-foreground [&_input]:border-sidebar-border [&_label]:text-sidebar-foreground [&_.text-muted-foreground]:text-sidebar-foreground/70">
              {action}
            </div>
          )}
        </div>
      </header>
      <main className="px-6 md:px-8 pb-8">{children}</main>
    </div>
  );
};

export default PageWrapper;
