
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const NavbarLogo = () => {
  return (
    <Link to="/" className="flex items-center">
      <Globe className="h-8 w-8 text-chosen-blue mr-2" />
      <span className="text-chosen-blue font-heading font-bold text-xl">Chosen</span>
    </Link>
  );
};

export default NavbarLogo;
