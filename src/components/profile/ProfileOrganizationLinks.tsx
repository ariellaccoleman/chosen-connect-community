
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
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useOrganizations, useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileFormValues } from "./ProfileForm";
import { OrganizationWithLocation } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface ProfileOrganizationLinksProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileOrganizationLinks = ({ form }: ProfileOrganizationLinksProps) => {
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [connectionType, setConnectionType] = useState<"current" | "former" | "ally">("current");
  const [department, setDepartment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizations();
  const { data: userRelationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);
  
  // Filter out organizations that the user already has a relationship with
  const availableOrganizations = organizations.filter(
    org => !userRelationships.some(rel => rel.organization_id === org.id)
  );

  const handleAddOrganization = async () => {
    // This will be implemented in the ProfileEdit page through a hook
    if (form.getValues("addOrganizationRelationship")) {
      form.setValue("addOrganizationRelationship", {
        organizationId: selectedOrgId,
        connectionType,
        department: department || null,
        notes: notes || null
      });
      
      // Reset form fields
      setSelectedOrgId("");
      setConnectionType("current");
      setDepartment("");
      setNotes("");
      setIsAddingNew(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Organizations</CardTitle>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || availableOrganizations.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Organization
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingRelationships ? (
          <div>Loading your organizations...</div>
        ) : userRelationships.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            You haven't added any organization connections yet.
          </div>
        ) : (
          <div className="space-y-4">
            {userRelationships.map(relationship => {
              const org = relationship.organization;
              if (!org) return null;
              
              return (
                <div 
                  key={relationship.id} 
                  className="flex items-start justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {relationship.connection_type === 'current' ? 'Current' : 
                       relationship.connection_type === 'former' ? 'Former' : 'Allied'}
                      {relationship.department && ` • ${relationship.department}`}
                    </div>
                    {relationship.notes && (
                      <div className="text-sm mt-1 text-gray-600">{relationship.notes}</div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500"
                    onClick={() => {
                      // Navigate to manage organizations page
                      if (form.getValues("navigateToManageOrgs")) {
                        form.setValue("navigateToManageOrgs", true);
                      }
                    }}
                  >
                    Edit
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Organization Form */}
        {isAddingNew && (
          <div className="border rounded-md p-4 mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Add Organization Connection</h4>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAddingNew(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Organization</label>
                <Select 
                  value={selectedOrgId} 
                  onValueChange={setSelectedOrgId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingOrgs ? (
                      <div className="p-2">Loading...</div>
                    ) : availableOrganizations.length === 0 ? (
                      <div className="p-2">No organizations available</div>
                    ) : (
                      availableOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Connection Type</label>
                <Select 
                  value={connectionType} 
                  onValueChange={(value: "current" | "former" | "ally") => setConnectionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Member</SelectItem>
                    <SelectItem value="former">Former Member</SelectItem>
                    <SelectItem value="ally">Allied Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Department (Optional)</label>
                <Input 
                  placeholder="E.g., Engineering, Marketing" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea 
                  placeholder="Any additional details about your connection" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="button" 
                  onClick={handleAddOrganization}
                  disabled={!selectedOrgId}
                  className="bg-chosen-blue hover:bg-chosen-navy"
                >
                  Add Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        <FormDescription>
          Manage your organization connections or add new ones. You can add more details and edit existing connections from the "Manage Organizations" page.
        </FormDescription>
      </CardContent>
    </Card>
  );
};

export default ProfileOrganizationLinks;
