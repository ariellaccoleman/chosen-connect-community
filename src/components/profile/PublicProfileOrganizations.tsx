
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { Briefcase, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PublicProfileOrganizationsProps {
  relationships: ProfileOrganizationRelationshipWithDetails[];
  isLoading: boolean;
}

const PublicProfileOrganizations = ({ relationships, isLoading }: PublicProfileOrganizationsProps) => {
  // Group relationships by connection type
  const currentOrgs = relationships.filter(rel => rel.connection_type === 'current');
  const formerOrgs = relationships.filter(rel => rel.connection_type === 'former');
  const alliedOrgs = relationships.filter(rel => rel.connection_type === 'connected_insider');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (relationships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            No organization connections
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Organizations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentOrgs.length > 0 && (
          <OrganizationGroup 
            title="Current" 
            icon={<Briefcase className="h-5 w-5" />}
            relationships={currentOrgs} 
          />
        )}
        
        {formerOrgs.length > 0 && (
          <OrganizationGroup 
            title="Former" 
            icon={<Building2 className="h-5 w-5" />}
            relationships={formerOrgs} 
          />
        )}
        
        {alliedOrgs.length > 0 && (
          <OrganizationGroup 
            title="Connected Insider" 
            icon={<ExternalLink className="h-5 w-5" />}
            relationships={alliedOrgs} 
          />
        )}
      </CardContent>
    </Card>
  );
};

interface OrganizationGroupProps {
  title: string;
  icon: React.ReactNode;
  relationships: ProfileOrganizationRelationshipWithDetails[];
}

const OrganizationGroup = ({ title, icon, relationships }: OrganizationGroupProps) => {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-3">
        {icon} {title}
      </h3>
      <div className="space-y-3">
        {relationships.map(relationship => (
          <OrganizationItem key={relationship.id} relationship={relationship} />
        ))}
      </div>
    </div>
  );
};

interface OrganizationItemProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
}

const OrganizationItem = ({ relationship }: OrganizationItemProps) => {
  const org = relationship.organization;
  if (!org) return null;
  
  return (
    <div className="flex items-start p-3 border rounded-md hover:bg-gray-50">
      <div className="flex-1">
        <div className="font-medium">{org.name}</div>
        {relationship.department && (
          <div className="text-sm text-gray-600">{relationship.department}</div>
        )}
        {org.location && (
          <div className="text-sm text-gray-500">{org.location.formatted_location}</div>
        )}
      </div>
      <Button 
        variant="outline" 
        size="sm"
        asChild
        className="flex-shrink-0"
      >
        <Link to={`/organizations/${org.id}`}>
          View
        </Link>
      </Button>
    </div>
  );
};

export default PublicProfileOrganizations;
