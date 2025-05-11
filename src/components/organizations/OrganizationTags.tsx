
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EntityTagManager from "@/components/tags/EntityTagManager";

interface OrganizationTagsProps {
  organizationId: string;
  isAdmin?: boolean;
}

const OrganizationTags = ({ organizationId, isAdmin = false }: OrganizationTagsProps) => {
  return (
    <Card>
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
        />
      </CardContent>
    </Card>
  );
};

export default OrganizationTags;
