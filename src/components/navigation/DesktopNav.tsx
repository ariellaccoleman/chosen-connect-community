
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfiles";
import UserAvatar from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DesktopNav = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  
  const isAdmin = user?.user_metadata?.role === "admin";

  if (user) {
    return (
      <>
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/organizations" className="text-gray-700 hover:text-chosen-blue font-medium">Organizations</Link>
          <Link to="/events" className="text-gray-700 hover:text-chosen-blue font-medium">Events</Link>
          <Link to="/directory" className="text-gray-700 hover:text-chosen-blue font-medium">Community Directory</Link>
          <Link to="/community-guide" className="text-gray-700 hover:text-chosen-blue font-medium">Community Guide</Link>
        </div>
        
        <div className="hidden md:flex items-center mr-4">
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
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile/edit")}>
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
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
      </>
    );
  }

  return (
    <>
      <div className="hidden md:flex items-center space-x-8">
        <Link to="/" className="text-gray-700 hover:text-chosen-blue font-medium">Home</Link>
        <Link to="/about" className="text-gray-700 hover:text-chosen-blue font-medium">About</Link>
        <Link to="/community-guide" className="text-gray-700 hover:text-chosen-blue font-medium">Community Guide</Link>
      </div>
      
      <div className="hidden md:flex items-center space-x-4 mr-4">
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
  );
};

export default DesktopNav;
