
import React from 'react';
import { CreditCard, Globe, FileText, Printer } from 'lucide-react';

interface Integration {
  name: string;
  type: string;
  rate: number;
  profit: number;
  icon: React.ReactNode;
}

const IntegrationList: React.FC = () => {
  const integrations: Integration[] = [
    {
      name: 'Banking Services',
      type: 'Finance',
      rate: 85,
      profit: 8500,
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      name: 'Online Services',
      type: 'Digital',
      rate: 70,
      profit: 7200,
      icon: <Globe className="w-5 h-5" />
    },
    {
      name: 'Applications',
      type: 'Documents',
      rate: 60,
      profit: 4300,
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'Photostat',
      type: 'Printing',
      rate: 45,
      profit: 2100,
      icon: <Printer className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
        <div>Service</div>
        <div>Type</div>
        <div>Rate</div>
        <div>Profit</div>
      </div>
      
      {integrations.map((integration, index) => (
        <div 
          key={integration.name} 
          className="grid grid-cols-4 gap-4 items-center py-3 px-2 rounded-lg hover:bg-muted/30 transition-all duration-200 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {integration.icon}
            </div>
            <span className="font-medium">{integration.name}</span>
          </div>
          
          <div className="text-muted-foreground">{integration.type}</div>
          
          <div className="flex items-center gap-2">
            <div className="progress-bar w-16">
              <div 
                className="progress-fill bg-gradient-to-r from-primary to-primary/60"
                style={{ 
                  width: `${integration.rate}%`,
                  animationDelay: `${index * 200}ms`
                }}
              />
            </div>
            <span className="text-sm font-medium">{integration.rate}%</span>
          </div>
          
          <div className="font-semibold">₹{integration.profit.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

export default IntegrationList;
