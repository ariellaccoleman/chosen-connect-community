
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const navigate = useNavigate();
  
  return (
    <section className="bg-chosen-blue py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">
          Ready to Join Our Community?
        </h2>
        <p className="text-lg text-chosen-light mb-10 max-w-3xl mx-auto">
          Connect with professionals who share your values. Join Chosen today to expand your network, discover opportunities, and make meaningful connections.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-white text-white hover:bg-white hover:text-chosen-blue bg-transparent"
            onClick={() => navigate("/auth")}
          >
            Log In
          </Button>
          <Button 
            size="lg" 
            className="bg-chosen-gold text-chosen-navy hover:bg-amber-400"
            onClick={() => navigate("/auth?tab=signup")}
          >
            Sign Up Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
