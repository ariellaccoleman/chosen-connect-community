
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
  // Get the id from URL parameters - matching route definition
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Add more comprehensive logging for debugging
  useEffect(() => {
    logger.info("OrganizationEdit - Component mounted with URL parameters:", { 
      id,
      idType: typeof id,
      idValue: id || "undefined",
      pathname: window.location.pathname
    });
    
    return () => {
      logger.info("OrganizationEdit - Component unmounting");
    };
  }, [id]);
  
  // The organization query - pass id directly to match the route parameter
  const { 
    data: organizationData, 
    isLoading, 
    error, 
    isError 
  } = useOrganization(id);
  
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
        hasOrgData: !!organizationData
      });
    }
  }, [organization, isLoading, error, organizationData]);
  
  // Check if user is admin - use id parameter
  const { 
    data: isOrgAdmin = false, 
    isLoading: adminCheckLoading 
  } = useIsOrganizationAdmin(user?.id, id);
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    // Only check admin status if loading is complete
    if (!adminCheckLoading && !isOrgAdmin && user && id) {
      logger.info("Admin check failed - redirecting", { 
        isOrgAdmin, 
        adminCheckLoading, 
        userId: user.id 
      });
      
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this organization",
        variant: "destructive",
      });
      
      navigate(`/organizations/${id}`);
    }
  }, [isOrgAdmin, adminCheckLoading, navigate, id, toast, user]);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {isLoading ? (
          <OrganizationEditSkeleton />
        ) : error || !organization ? (
          <OrganizationEditError error={error} orgId={id} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <OrganizationEditHeader orgId={id || ''} />
            <OrganizationEditForm 
              organization={organization} 
              orgId={id || ''}
            >
              <OrganizationEditTabs 
                orgId={id || ''} 
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
