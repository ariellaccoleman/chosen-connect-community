
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { extractErrorMessage } from "@/utils/errorUtils";

interface OrganizationEditErrorProps {
  error?: Error | unknown;
  orgId?: string;
}

export function OrganizationEditError({ error, orgId }: OrganizationEditErrorProps) {
  const navigate = useNavigate();

  if (error) {
    const errorMessage = extractErrorMessage(error);
    
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p>Error loading organization: {errorMessage}</p>
          <Button className="mt-4" onClick={() => navigate('/organizations')}>
            Return to Organizations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-64">
      <p className="text-xl mb-4">Organization not found</p>
      <p className="text-sm text-muted-foreground mb-4">
        The organization with ID {orgId} could not be found.
      </p>
      <Button onClick={() => navigate('/organizations')}>
        Return to Organizations
      </Button>
    </div>
  );
}
