
import { useToggle } from "@/hooks/useToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import NavbarLogo from "./navigation/NavbarLogo";
import DesktopNav from "./navigation/DesktopNav";
import MobileNav from "./navigation/MobileNav";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldCheck, Sun, Moon, SunMoon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import UserAvatar from "./navigation/UserAvatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
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

const Navbar = () => {
  const [isMenuOpen, toggleMenu, setMenuOpen] = useToggle(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profileData } = useCurrentProfile();
  const { theme, setTheme } = useTheme();
  
  const isAdmin = user?.user_metadata?.role === "admin";
  const profile = profileData?.data;

  // Close mobile menu on screen resize
  if (!isMobile && isMenuOpen) {
    setMenuOpen(false);
  }

  // User menu component
  const UserMenu = () => {
    if (user) {
      return (
        <div className="hidden md:flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative rounded-full p-0 h-10 w-10 flex items-center justify-center">
                <UserAvatar profile={profile} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start p-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile/edit")}>
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex items-center">
                    {theme === "dark" && <Moon className="mr-2 h-4 w-4" />}
                    {theme === "light" && <Sun className="mr-2 h-4 w-4" />}
                    {theme === "system" && <SunMoon className="mr-2 h-4 w-4" />}
                    <span>Theme</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                    <DropdownMenuRadioItem value="light">
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <SunMoon className="mr-2 h-4 w-4" />
                      <span>System</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className="hidden md:flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
            >
              {theme === "dark" && <Moon className="h-4 w-4" />}
              {theme === "light" && <Sun className="h-4 w-4" />}
              {theme === "system" && <SunMoon className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <SunMoon className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          className="border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white dark:border-chosen-blue/80 dark:text-chosen-blue/80 dark:hover:bg-chosen-blue/80 dark:hover:text-white"
          onClick={() => navigate("/auth")}
        >
          Log In
        </Button>
        <Button 
          className="bg-chosen-blue text-white hover:bg-chosen-navy dark:bg-chosen-blue/90 dark:hover:bg-chosen-navy/90"
          onClick={() => navigate("/auth?tab=signup")}
        >
          Sign Up
        </Button>
      </div>
    );
  };

  return (
    <nav className="bg-white dark:bg-sidebar shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavbarLogo />
          </div>
          
          {/* Center the navigation links */}
          <div className="hidden md:flex flex-1 justify-center">
            <DesktopNav />
          </div>
          
          {/* Position user menu on the right */}
          <div className="flex items-center">
            <UserMenu />
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue focus:outline-none"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <MobileNav isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
    </nav>
  );
};

export default Navbar;
