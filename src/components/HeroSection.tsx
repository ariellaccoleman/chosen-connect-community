
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-gradient text-white pb-16 pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-tight mb-6">
              Connect with Pro-Israel Professionals
            </h1>
            <div className="h-1 w-24 gold-gradient mb-6 rounded-full"></div>
            <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-xl">
              Join the premier professional network dedicated to fostering connections, opportunities, and growth for pro-Jewish and pro-Israel professionals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                className="btn-secondary" 
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Join Now
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-chosen-navy bg-white hover:bg-gray-100 hover:text-chosen-navy" 
                size="lg"
                onClick={() => navigate("/about")}
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end animate-fade-in">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Professionals networking" 
              className="rounded-lg shadow-2xl w-full max-w-md object-cover h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
