import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  IconUserAdmin,
  IconPalette,
  IconPrint,
  IconHome,
  IconMilk,
  IconExpense,
  IconMoney,
} from '@/components/icons/IconoirIcons';
import { Button } from '@/components/ui/button';

const adminItems = [
  { icon: <IconUserAdmin size={28} />, label: 'User Admin', to: '/user-admin', description: 'Manage user accounts and roles' },
  { icon: <IconPalette size={28} />, label: 'Theme Settings', to: '/theme-settings', description: 'Customize appearance and theme' },
  { icon: <IconPrint size={28} />, label: 'Print', to: '/downloads', description: 'Print and download center' },
];

const householdItems = [
  { icon: <IconMilk size={28} />, label: 'Milk', to: '/milk', description: 'Track daily milk records' },
  { icon: <IconExpense size={28} />, label: 'Misc Expenses', to: '/misc-expenses', description: 'Miscellaneous household expenses' },
  { icon: <IconMoney size={28} />, label: 'Money (Udhar)', to: '/udhar', description: 'Lend/borrow tracking' },
];

const Card = ({ icon, label, to, description }: { icon: JSX.Element; label: string; to: string; description: string }) => (
  <Link
    to={to}
    className="group flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all"
  >
    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </Link>
);

const Admin = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin</h1>
            <p className="text-sm text-muted-foreground">Administrative tools and household management</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminItems.map((item) => (
              <Card key={item.to} {...item} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <IconHome size={18} />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Household</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {householdItems.map((item) => (
              <Card key={item.to} {...item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;