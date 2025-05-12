
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
    <div className="page-transition p-6 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="mt-4 md:mt-0">{action}</div>}
      </header>
      <main>{children}</main>
    </div>
  );
};

export default PageWrapper;
