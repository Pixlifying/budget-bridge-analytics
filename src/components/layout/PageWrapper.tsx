
import { ReactNode } from 'react';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

const PageWrapper = ({ title, subtitle, action, children }: PageWrapperProps) => {
  return (
    <div className="page-transition p-6 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="mt-4 md:mt-0">{action}</div>}
      </header>
      <main>{children}</main>
    </div>
  );
};

export default PageWrapper;
