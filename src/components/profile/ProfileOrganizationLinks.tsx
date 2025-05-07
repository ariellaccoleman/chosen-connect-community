
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
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

interface ProfileOrganizationLinksProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileOrganizationLinks = ({ form }: ProfileOrganizationLinksProps) => {
  const { user } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizations();
  const { data: userRelationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);
  
  // Filter out organizations that the user already has a relationship with
  const availableOrganizations = organizations.filter(
    org => !userRelationships.some(rel => rel.organization_id === org.id)
  );

  const handleAddOrganization = (data: {
    organizationId: string;
    connectionType: "current" | "former" | "ally";
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
          relationships={userRelationships as ProfileOrganizationRelationshipWithDetails[]}
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
