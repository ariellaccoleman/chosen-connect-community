
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmptyOrganizationState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">You haven't added any organizations yet</p>
      <Button 
        onClick={() => navigate("/organizations")}
        className="bg-chosen-blue hover:bg-chosen-navy"
      >
        Browse Organizations
      </Button>
    </div>
  );
};

export default EmptyOrganizationState;
