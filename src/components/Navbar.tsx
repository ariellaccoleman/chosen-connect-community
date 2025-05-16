
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToggle } from "@/hooks/useToggle";
import NavbarLogo from "./navigation/NavbarLogo";
import DesktopNav from "./navigation/DesktopNav";
import MobileNav from "./navigation/MobileNav";

const Navbar = () => {
  const [isMenuOpen, toggleMenu, setMenuOpen] = useToggle(false);
  const isMobile = useIsMobile();

  // Close mobile menu on screen resize
  if (!isMobile && isMenuOpen) {
    setMenuOpen(false);
  }

  return (
    <nav className="bg-white dark:bg-sidebar shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <NavbarLogo />
          </div>
          
          <div className="flex items-center justify-end flex-1">
            <DesktopNav />
            
            <div className="flex items-center ml-2">
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
      </div>
      
      {/* Mobile menu */}
      <MobileNav isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
    </nav>
  );
};

export default Navbar;
