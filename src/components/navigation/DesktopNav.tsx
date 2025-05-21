
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const DesktopNav = () => {
  const { user } = useAuth();
  
  // Only render navigation links without user menu
  const NavigationLinks = () => {
    if (user) {
      return (
        <div className="flex items-center space-x-8">
          <Link to="/chat" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Chat</Link>
          <Link to="/organizations" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Organizations</Link>
          <Link to="/events" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Events</Link>
          <Link to="/community" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Community</Link>
          <Link to="/hubs" className="text-gray-700 dark:text-gray-200 hover:text-chosen-blue dark:hover:text-chosen-blue font-medium">Hubs</Link>
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
