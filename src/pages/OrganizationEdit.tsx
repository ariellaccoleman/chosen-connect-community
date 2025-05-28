
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsOrganizationAdmin, useOrganization } from "@/hooks/organizations";
import { logger } from "@/utils/logger";
import Layout from "@/components/layout/Layout";
import {
  OrganizationEditForm,
  OrganizationEditTabs,
  OrganizationEditHeader,
  OrganizationEditSkeleton,
  OrganizationEditError
} from "@/components/organizations/edit";

const OrganizationEdit = () => {
  // Get the orgId from URL parameters - matching route definition
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Add more comprehensive logging for debugging
  useEffect(() => {
    logger.info("OrganizationEdit - Component mounted with URL parameters:", { 
      orgId,
      orgIdType: typeof orgId,
      orgIdValue: orgId || "undefined",
      pathname: window.location.pathname
    });
    
    return () => {
      logger.info("OrganizationEdit - Component unmounting");
    };
  }, [orgId]);
  
  // The organization query - pass orgId directly to match the route parameter
  const { 
    data: organizationData, 
    isLoading, 
    error, 
    isError 
  } = useOrganization(orgId);
  
  // Safely access organization data with extra logging
  const organization = organizationData?.data || null;
  
  useEffect(() => {
    if (organization) {
      logger.info("Organization data retrieved successfully:", {
        name: organization.name,
        id: organization.id,
        hasLocation: !!organization.location
      });
    } else if (!isLoading) {
      logger.warn("No organization data retrieved after loading completed", {
        error: error?.message || "No specific error message",
        hasErrorObj: !!error,
        hasOrgData: !!organizationData,
        orgId: orgId || "undefined"
      });
    }
  }, [organization, isLoading, error, organizationData, orgId]);
  
  // Check if user is admin - use orgId parameter
  const { 
    data: isOrgAdmin = false, 
    isLoading: adminCheckLoading 
  } = useIsOrganizationAdmin(user?.id, orgId);
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    // Only check admin status if loading is complete
    if (!adminCheckLoading && !isOrgAdmin && user && orgId) {
      logger.info("Admin check failed - redirecting", { 
        isOrgAdmin, 
        adminCheckLoading, 
        userId: user.id,
        orgId
      });
      
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this organization",
        variant: "destructive",
      });
      
      navigate(`/organizations/${orgId}`);
    }
  }, [isOrgAdmin, adminCheckLoading, navigate, orgId, toast, user]);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {isLoading ? (
          <OrganizationEditSkeleton />
        ) : error || !organization ? (
          <OrganizationEditError error={error} orgId={orgId} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <OrganizationEditHeader orgId={orgId || ''} />
            <OrganizationEditForm 
              organization={organization} 
              orgId={orgId || ''}
            >
              <OrganizationEditTabs 
                orgId={orgId || ''} 
                isOrgAdmin={isOrgAdmin}
                organization={organization}
              />
            </OrganizationEditForm>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrganizationEdit;
