
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const NavbarLogo = () => {
  const { user } = useAuth();
  const destination = user ? "/dashboard" : "/";

  return (
    <Link to={destination} className="flex items-center">
      <Globe className="h-8 w-8 text-chosen-blue mr-2" />
      <span className="text-chosen-blue font-heading font-bold text-xl">Chosen</span>
    </Link>
  );
};

export default NavbarLogo;
