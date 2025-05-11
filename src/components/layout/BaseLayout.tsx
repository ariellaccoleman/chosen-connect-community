
import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BaseLayoutProps {
  children: ReactNode;
  className?: string;
  includeNavbar?: boolean;
}

const BaseLayout = ({ children, className = "", includeNavbar = true }: BaseLayoutProps) => {
  return (
    <div className={`flex flex-col min-h-screen ${className}`}>
      {includeNavbar && <Navbar />}
      <main className={`flex-grow ${includeNavbar ? 'pt-16' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default BaseLayout;
