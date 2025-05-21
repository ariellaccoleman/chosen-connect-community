
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldCheck, Sun, Moon, SunMoon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import UserAvatar from "./UserAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

const DesktopNav = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profileData } = useCurrentProfile();
  const { theme, setTheme } = useTheme();
  
  const isAdmin = user?.user_metadata?.role === "admin";
  const profile = profileData?.data;

  // Only render navigation links without user menu
  const NavigationLinks = () => {
    if (user) {
      return (
        <div className="flex items-center space-x-8">
          <Link to="/chat" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Chat</Link>
          <Link to="/organizations" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Organizations</Link>
          <Link to="/events" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Events</Link>
          <Link to="/community" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Community</Link>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Home</Link>
        <Link to="/about" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">About</Link>
      </div>
    );
  };

  return <NavigationLinks />;
};

export default DesktopNav;
