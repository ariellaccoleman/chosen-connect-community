
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface OrganizationTagsProps {
  organizationId: string;
  isAdmin?: boolean;
}

const OrganizationTags = ({ organizationId, isAdmin = false }: OrganizationTagsProps) => {
  const [isManagingTags, setIsManagingTags] = useState(false);
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Organization Tags</CardTitle>
          <CardDescription>
            Tags help categorize this organization and make it discoverable by users.
          </CardDescription>
        </div>
        {isAdmin && !isManagingTags && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsManagingTags(true)}
            className="ml-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Manage Tags
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <EntityTagManager
          entityId={organizationId}
          entityType="organization"
          isAdmin={isAdmin}
          isEditing={isManagingTags}
          onFinishEditing={() => setIsManagingTags(false)}
          showEntityType={false} // Don't show entity type for organization tags
        />
      </CardContent>
    </Card>
  );
};

export default OrganizationTags;
