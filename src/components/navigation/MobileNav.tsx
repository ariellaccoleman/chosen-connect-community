import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import UserAvatar from "./UserAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, SunMoon } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profileData } = useCurrentProfile();
  const { theme, setTheme } = useTheme();
  
  const isAdmin = user?.user_metadata?.role === "admin";
  const profile = profileData?.data;
  
  const themeOptions = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4 mr-2" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4 mr-2" /> },
    { value: "system", label: "System", icon: <SunMoon className="h-4 w-4 mr-2" /> }
  ];

  if (!isOpen) return null;

  if (user) {
    return (
      <div className="md:hidden bg-white dark:bg-sidebar shadow-lg">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div className="flex items-center px-3 py-2">
            <UserAvatar profile={profile} className="mr-3" />
            <div>
              <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <Link 
            to="/profile/edit" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Edit Profile
          </Link>
          
          <Link 
            to="/community/guide" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Community Guide
          </Link>
          
          <div className="px-3 py-2">
            <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">Theme</p>
            <div className="flex space-x-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                  className="flex items-center"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
              onClick={onClose}
            >
              Admin Panel
            </Link>
          )}
          
          <Link 
            to="/feed" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Feed
          </Link>
          <Link 
            to="/chat" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Chat
          </Link>
          <Link 
            to="/hubs" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Hubs
          </Link>
          <Link 
            to="/events" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Events
          </Link>
          <Link 
            to="/community" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Community
          </Link>
          <Link 
            to="/organizations" 
            className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Organizations
          </Link>
          <button 
            onClick={() => {
              signOut();
              onClose();
            }} 
            className="w-full text-left text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden bg-white dark:bg-sidebar shadow-lg">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <div className="px-3 py-2">
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">Theme</p>
          <div className="flex space-x-2">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                variant={theme === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                className="flex items-center"
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <Link 
          to="/" 
          className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          onClick={onClose}
        >
          Home
        </Link>
        <Link 
          to="/about" 
          className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          onClick={onClose}
        >
          About
        </Link>
        <Link 
          to="/community/guide" 
          className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          onClick={onClose}
        >
          Community Guide
        </Link>
      </div>
      <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700 flex flex-col space-y-2 px-4">
        <Button 
          variant="outline" 
          className="w-full border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white dark:border-chosen-blue/80 dark:text-chosen-blue/80 dark:hover:bg-chosen-blue/80 dark:hover:text-white justify-center"
          onClick={() => {
            navigate("/auth");
            onClose();
          }}
        >
          Log In
        </Button>
        <Button 
          className="w-full bg-chosen-blue text-white hover:bg-chosen-navy dark:bg-chosen-blue/90 dark:hover:bg-chosen-navy/90 justify-center"
          onClick={() => {
            navigate("/auth?tab=signup");
            onClose();
          }}
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
};

export default MobileNav;
