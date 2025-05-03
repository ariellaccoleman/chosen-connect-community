
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentProfile } from "@/hooks/useProfiles";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";
    
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Globe className="h-8 w-8 text-chosen-blue mr-2" />
              <span className="text-chosen-blue font-heading font-bold text-xl">Chosen</span>
            </Link>
          </div>
          
          {user ? (
            // Authenticated navigation
            <>
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/dashboard" className="text-gray-700 hover:text-chosen-blue font-medium">Dashboard</Link>
                <Link to="/organizations" className="text-gray-700 hover:text-chosen-blue font-medium">Organizations</Link>
              </div>
              
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-chosen-blue text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start p-2">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            // Unauthenticated navigation
            <>
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/" className="text-gray-700 hover:text-chosen-blue font-medium">Home</Link>
                <Link to="/about" className="text-gray-700 hover:text-chosen-blue font-medium">About</Link>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  className="border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white"
                  onClick={() => navigate("/auth")}
                >
                  Log In
                </Button>
                <Button 
                  className="bg-chosen-blue text-white hover:bg-chosen-navy"
                  onClick={() => navigate("/auth?tab=signup")}
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}
          
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-chosen-blue focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          {user ? (
            // Authenticated mobile menu
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="flex items-center px-3 py-2">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-chosen-blue text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <Link 
                to="/dashboard" 
                className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              <Link 
                to="/profile" 
                className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
                onClick={toggleMenu}
              >
                Edit Profile
              </Link>
              <Link 
                to="/organizations" 
                className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
                onClick={toggleMenu}
              >
                Organizations
              </Link>
              <button 
                onClick={() => {
                  signOut();
                  toggleMenu();
                }} 
                className="w-full text-left text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
              >
                Log Out
              </button>
            </div>
          ) : (
            // Unauthenticated mobile menu
            <div>
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
                  onClick={toggleMenu}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
                  onClick={toggleMenu}
                >
                  About
                </Link>
              </div>
              <div className="pt-4 pb-3 border-t border-gray-200 flex flex-col space-y-2 px-4">
                <Button 
                  variant="outline" 
                  className="w-full border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white justify-center"
                  onClick={() => {
                    navigate("/auth");
                    toggleMenu();
                  }}
                >
                  Log In
                </Button>
                <Button 
                  className="w-full bg-chosen-blue text-white hover:bg-chosen-navy justify-center"
                  onClick={() => {
                    navigate("/auth?tab=signup");
                    toggleMenu();
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
