
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizationRelationships, useOrganizations } from "@/hooks/organizations";
import Layout from "@/components/layout/Layout";
import OrganizationConnectionsHeader from "@/components/organizations/OrganizationConnectionsHeader";
import OrganizationConnectionDialog from "@/components/organizations/OrganizationConnectionDialog";
import OrganizationRelationshipList from "@/components/organizations/OrganizationRelationshipList";
import { filterAvailableOrganizations } from "@/utils/organizationFormatters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { logger } from "@/utils/logger";

const ManageOrganizationConnections = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch user's organization relationships
  const { 
    data: relationshipsResponse,
    isLoading: relationshipsLoading,
    error: relationshipsError
  } = useUserOrganizationRelationships(user?.id);
  const relationships = relationshipsResponse?.data || [];
  
  // Fetch all organizations for connecting
  const { 
    data: organizationsResponse,
    isLoading: organizationsLoading,
    error: organizationsError
  } = useOrganizations();
  const organizations = organizationsResponse?.data || [];
  
  // Filter out organizations the user is already connected to
  const availableOrganizations = filterAvailableOrganizations(organizations, relationships);
  
  // Log for debugging
  logger.info('ManageOrganizationConnections component state:', {
    userId: user?.id,
    relationshipsCount: relationships?.length,
    organizationsCount: organizations?.length,
    availableOrganizationsCount: availableOrganizations?.length,
    isDialogOpen,
    isLoading: relationshipsLoading || organizationsLoading
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className="container py-8">
        <OrganizationConnectionsHeader 
          onConnectClick={() => setIsDialogOpen(true)}
          availableOrganizationsCount={availableOrganizations.length}
        />
        
        {/* Error states */}
        {(relationshipsError || organizationsError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {relationshipsError ? 'Failed to load your organization connections.' : 
               organizationsError ? 'Failed to load available organizations.' : 
               'An error occurred. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Organization list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <OrganizationRelationshipList 
            relationships={relationships}
            isLoading={relationshipsLoading}
          />
        </div>
        
        {/* Connection dialog */}
        <OrganizationConnectionDialog 
          isOpen={isDialogOpen}
          onOpenChange={handleCloseDialog}
          organizations={availableOrganizations}
          isLoading={organizationsLoading}
          userId={user?.id}
        />
      </div>
    </Layout>
  );
};

export default ManageOrganizationConnections;
