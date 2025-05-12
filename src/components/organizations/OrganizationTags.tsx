
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EntityTagManager from "@/components/tags/EntityTagManager";

interface OrganizationTagsProps {
  organizationId: string;
  isAdmin?: boolean;
}

const OrganizationTags = ({ organizationId, isAdmin = false }: OrganizationTagsProps) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Organization Tags</CardTitle>
        <CardDescription>
          Tags help categorize this organization and make it discoverable by users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EntityTagManager
          entityId={organizationId}
          entityType="organization"
          isAdmin={isAdmin}
          isEditing={isAdmin} // Always show in editing mode for admins
          showEntityType={false} // Don't show entity type for organization tags
        />
      </CardContent>
    </Card>
  );
};

export default OrganizationTags;
