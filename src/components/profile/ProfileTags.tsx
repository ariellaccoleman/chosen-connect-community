
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EntityTagManager from "@/components/tags/EntityTagManager";

interface ProfileTagsProps {
  profileId: string;
  isAdmin?: boolean;
}

const ProfileTags = ({ profileId, isAdmin = false }: ProfileTagsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Skills & Tags</CardTitle>
        <CardDescription>
          Add tags to your profile to help others find you and connect with you based on your skills and interests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EntityTagManager 
          entityId={profileId}
          entityType="person"
          isAdmin={isAdmin}
          isEditing={true} // Always show in editing mode since we're on the edit page
          showEntityType={false}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileTags;
