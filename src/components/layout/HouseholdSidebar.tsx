import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { IconMilk, IconExpense, IconMoney, IconHome } from '@/components/icons/IconoirIcons';

const householdItems = [
  { icon: <IconMilk size={16} />, label: 'Milk', to: '/milk' },
  { icon: <IconExpense size={16} />, label: 'Misc Expenses', to: '/misc-expenses' },
  { icon: <IconMoney size={16} />, label: 'Money (Udhar)', to: '/udhar' },
];

const HouseholdSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex h-screen w-56 flex-col sticky top-0 p-3">
      <div className="flex-1 rounded-3xl shadow-xl flex flex-col overflow-hidden border transition-colors duration-300 bg-sidebar border-sidebar-border shadow-primary/20">
        <div className="p-4 border-b border-sidebar-border/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-sidebar-foreground">
              <IconHome size={18} />
            </div>
            <h2 className="font-semibold text-sm text-sidebar-foreground">Household</h2>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {householdItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="shrink-0 w-4 h-4">{item.icon}</div>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default HouseholdSidebar;
