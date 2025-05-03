
import { Button } from "@/components/ui/button";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-chosen-blue font-medium">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-chosen-blue font-medium">About</Link>
            <Link to="/features" className="text-gray-700 hover:text-chosen-blue font-medium">Features</Link>
            <Link to="/careers" className="text-gray-700 hover:text-chosen-blue font-medium">Careers</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" className="border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white">
              Log In
            </Button>
            <Button className="bg-chosen-blue text-white hover:bg-chosen-navy">
              Sign Up
            </Button>
          </div>
          
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
            <Link 
              to="/features" 
              className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
              onClick={toggleMenu}
            >
              Features
            </Link>
            <Link 
              to="/careers" 
              className="text-gray-700 hover:text-chosen-blue block px-3 py-2 rounded-md text-base font-medium"
              onClick={toggleMenu}
            >
              Careers
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 flex flex-col space-y-2 px-4">
            <Button variant="outline" className="w-full border-chosen-blue text-chosen-blue hover:bg-chosen-blue hover:text-white justify-center">
              Log In
            </Button>
            <Button className="w-full bg-chosen-blue text-white hover:bg-chosen-navy justify-center">
              Sign Up
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
