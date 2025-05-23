
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useOrganizations, useUserOrganizationRelationships } from "@/hooks/organizations";
import { ProfileFormValues } from "./ProfileForm";
import { useAuth } from "@/hooks/useAuth";
import OrganizationHeader from "./organization/OrganizationHeader";
import OrganizationList from "./organization/OrganizationList";
import OrganizationFormDialog from "./organization/OrganizationFormDialog";
import { formatOrganizationRelationships, filterAvailableOrganizations } from "@/utils/organizationFormatters";
import { logger } from "@/utils/logger";
import { APP_ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";

interface ProfileOrganizationLinksProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileOrganizationLinks = ({ form }: ProfileOrganizationLinksProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  
  const { data: organizationsResponse } = useOrganizations();
  const organizations = organizationsResponse?.data || [];
  
  const { data: relationshipsResponse } = useUserOrganizationRelationships(user?.id);
  const relationships = relationshipsResponse?.data || [];
  
  const isLoadingOrgs = false; // We'll simplify this for now
  const isLoadingRelationships = false; // We'll simplify this for now
  
  // Use our utility functions to format and filter organizations
  const formattedRelationships = formatOrganizationRelationships(relationships);
  const availableOrganizations = filterAvailableOrganizations(organizations, relationships);

  const handleAddOrganization = (data: {
    organizationId: string;
    connectionType: "current" | "former" | "connected_insider";
    department: string | null;
    notes: string | null;
  }) => {
    form.setValue("addOrganizationRelationship", {
      organizationId: data.organizationId,
      connectionType: data.connectionType,
      department: data.department,
      notes: data.notes
    });
    setIsAddingNew(false); // Close the dialog after form submission
  };

  // Toggle function to show the add organization dialog
  const toggleAddOrganization = () => {
    setIsAddingNew(true);
  };
  
  // Navigate to manage organizations page
  const handleManageOrganizations = () => {
    navigate(APP_ROUTES.MANAGE_ORGANIZATIONS);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <OrganizationHeader
          onAddOrgClick={toggleAddOrganization}
          isAddingNew={isAddingNew}
          availableOrgsCount={availableOrganizations.length}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <OrganizationList
          relationships={formattedRelationships}
          isLoading={isLoadingRelationships}
          onManageClick={handleManageOrganizations}
        />

        {/* Always render the dialog but control visibility with isAddingNew */}
        <OrganizationFormDialog
          organizations={availableOrganizations}
          isLoadingOrgs={isLoadingOrgs}
          onClose={() => setIsAddingNew(false)}
          onSubmit={handleAddOrganization}
          isOpen={isAddingNew}
        />

        <FormDescription>
          Manage your organization connections or add new ones. You can add more details and edit existing connections from the "Manage Organizations" page.
        </FormDescription>
        
        <div className="flex justify-center mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleManageOrganizations}
          >
            Manage All Organizations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileOrganizationLinks;
