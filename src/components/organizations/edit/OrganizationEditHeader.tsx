
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface OrganizationEditHeaderProps {
  orgId: string;
}

export function OrganizationEditHeader({ orgId }: OrganizationEditHeaderProps) {
  const navigate = useNavigate();
  
  // Update to use browser history instead of hardcoded route
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="mb-6">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-6">Edit Organization</h1>
    </div>
  );
}
