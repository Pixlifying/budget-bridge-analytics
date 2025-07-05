
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

const SidebarHeader = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">Dashboard</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
};

export default SidebarHeader;
