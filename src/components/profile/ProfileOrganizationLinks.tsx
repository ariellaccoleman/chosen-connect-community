
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
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
import { useOrganizations, useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import { ProfileFormValues } from "./ProfileForm";
import { useAuth } from "@/hooks/useAuth";
import OrganizationHeader from "./organization/OrganizationHeader";
import OrganizationList from "./organization/OrganizationList";
import OrganizationFormDialog from "./organization/OrganizationFormDialog";
import { formatLocationWithDetails } from "@/utils/adminFormatters";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

interface ProfileOrganizationLinksProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileOrganizationLinks = ({ form }: ProfileOrganizationLinksProps) => {
  const { user } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizations();
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);
  
  // Filter out organizations that the user already has a relationship with
  const availableOrganizations = organizations.filter(
    org => !relationships.some(rel => rel.organization_id === org.id)
  );

  // Format relationships to ensure they meet the ProfileOrganizationRelationshipWithDetails type
  const formattedRelationships: ProfileOrganizationRelationshipWithDetails[] = relationships.map(rel => {
    // Ensure the organization and its location have the expected structure
    const organization = {
      ...rel.organization,
      location: rel.organization.location ? formatLocationWithDetails(rel.organization.location) : undefined
    };
    
    return {
      ...rel,
      organization
    };
  });

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
    setIsAddingNew(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <OrganizationHeader
          onAddOrgClick={() => setIsAddingNew(true)}
          isAddingNew={isAddingNew}
          availableOrgsCount={availableOrganizations.length}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <OrganizationList
          relationships={formattedRelationships}
          isLoading={isLoadingRelationships}
          onManageClick={() => form.setValue("navigateToManageOrgs", true)}
        />

        {/* Add New Organization Form */}
        {isAddingNew && (
          <OrganizationFormDialog
            organizations={availableOrganizations}
            isLoadingOrgs={isLoadingOrgs}
            onClose={() => setIsAddingNew(false)}
            onSubmit={handleAddOrganization}
          />
        )}

        <FormDescription>
          Manage your organization connections or add new ones. You can add more details and edit existing connections from the "Manage Organizations" page.
        </FormDescription>
      </CardContent>
    </Card>
  );
};

export default ProfileOrganizationLinks;
