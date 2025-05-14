
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";
import { useOrganization } from "@/hooks/useOrganizationQueries";
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
  // Ensure we're using the correct param name that matches the route definition
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Enhanced logging for debugging
  logger.info("OrganizationEdit - Component mounted with params:", { orgId });
  logger.info("OrganizationEdit - Current user:", { userId: user?.id });
  
  // The organization query
  const { data: organizationData, isLoading, error } = useOrganization(orgId);
  // Safely access organization data
  const organization = organizationData?.data || null;
  
  // Add more detailed logging about the organization response
  useEffect(() => {
    logger.info("Organization response:", { 
      hasData: !!organizationData, 
      hasOrganizationData: !!organization,
      orgName: organization?.name,
      error: error?.message
    });
  }, [organizationData, organization, error]);
  
  // Check if user is admin
  const { data: isOrgAdmin = false, isLoading: adminCheckLoading } = useIsOrganizationAdmin(user?.id, orgId);
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    // Only check admin status if loading is complete
    if (!adminCheckLoading && !isOrgAdmin && user && orgId) {
      logger.info("Admin check failed - redirecting", { isOrgAdmin, adminCheckLoading, userId: user.id });
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this organization",
        variant: "destructive",
      });
      navigate(`/organizations/${orgId}`);
    }
  }, [isOrgAdmin, adminCheckLoading, navigate, orgId, toast, user]);

  // Log when query finishes loading
  useEffect(() => {
    if (!isLoading) {
      logger.info("Organization query completed:", { 
        hasData: !!organization, 
        hasError: !!error,
        errorMessage: error?.message
      });
    }
  }, [isLoading, organization, error]);

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {isLoading ? (
          <OrganizationEditSkeleton />
        ) : error || !organization ? (
          <OrganizationEditError error={error} orgId={orgId} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <OrganizationEditHeader orgId={orgId!} />
            <OrganizationEditForm 
              organization={organization} 
              orgId={orgId!}
            >
              <OrganizationEditTabs 
                orgId={orgId!} 
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
