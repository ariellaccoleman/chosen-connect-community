import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfiles";
import UserAvatar from "./UserAvatar";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  
  const isAdmin = user?.user_metadata?.role === "admin";

  if (!isOpen) return null;

  if (user) {
    return (
      <div className="md:hidden bg-white shadow-lg">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div className="flex items-center px-3 py-2">
            <UserAvatar profile={profile} className="mr-3" />
            <div>
              <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <Link 
            to="/profile/edit" 
            className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Edit Profile
          </Link>
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
              onClick={onClose}
            >
              Admin Panel
            </Link>
          )}
          <Link 
            to="/organizations" 
            className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Organizations
          </Link>
          <Link 
            to="/events" 
            className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Events
          </Link>
          <Link 
            to="/directory" 
            className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Community Directory
          </Link>
          <Link 
            to="/community-guide" 
            className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
            onClick={onClose}
          >
            Community Guide
          </Link>
          <button 
            onClick={() => {
              signOut();
              onClose();
            }} 
            className="w-full text-left text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden bg-white shadow-lg">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <Link 
          to="/" 
          className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          onClick={onClose}
        >
          Home
        </Link>
        <Link 
          to="/about" 
          className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          onClick={onClose}
        >
          About
        </Link>
        <Link 
          to="/community-guide" 
          className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
          onClick={onClose}
        >
          Community Guide
        </Link>
      </div>
      <div className="pt-4 pb-3 border-t border-gray-200 flex flex-col space-y-2 px-4">
        <Button 
          variant="outline" 
          className="w-full border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white justify-center"
          onClick={() => {
            navigate("/auth");
            onClose();
          }}
        >
          Log In
        </Button>
        <Button 
          className="w-full bg-chosen-blue text-white hover:bg-chosen-navy justify-center"
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
