
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const LogoutButton = () => {
  const handleLogout = () => {
    localStorage.removeItem('site_authenticated');
    toast.success('Logged out successfully');
    window.location.reload();
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
};

export default LogoutButton;
