
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import OrganizationRelationshipList from "@/components/organizations/OrganizationRelationshipList";

interface OrganizationTabsProps {
  relationships: ProfileOrganizationRelationshipWithDetails[];
  activeTab: string;
  onTabChange: (value: string) => void;
  onEditClick: (relationship: ProfileOrganizationRelationshipWithDetails) => void;
}

const OrganizationTabs = ({
  relationships,
  activeTab,
  onTabChange,
  onEditClick
}: OrganizationTabsProps) => {
  // Filter relationships by type
  const currentRelationships = relationships.filter(rel => rel.connection_type === 'current');
  const formerRelationships = relationships.filter(rel => rel.connection_type === 'former');
  const connectedInsiderRelationships = relationships.filter(rel => rel.connection_type === 'connected_insider');

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={onTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="all">
          All ({relationships.length})
        </TabsTrigger>
        <TabsTrigger value="current">
          Current Employees ({currentRelationships.length})
        </TabsTrigger>
        <TabsTrigger value="former">
          Former Employees ({formerRelationships.length})
        </TabsTrigger>
        <TabsTrigger value="connected_insider">
          Connected Insiders ({connectedInsiderRelationships.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all">
        <OrganizationRelationshipList 
          relationships={relationships}
          onEditClick={onEditClick}
          emptyMessage="No organizations"
        />
      </TabsContent>
      
      <TabsContent value="current">
        <OrganizationRelationshipList 
          relationships={currentRelationships}
          onEditClick={onEditClick}
          emptyMessage="No current organizations"
        />
      </TabsContent>
      
      <TabsContent value="former">
        <OrganizationRelationshipList 
          relationships={formerRelationships}
          onEditClick={onEditClick}
          emptyMessage="No former organizations"
        />
      </TabsContent>
      
      <TabsContent value="connected_insider">
        <OrganizationRelationshipList 
          relationships={connectedInsiderRelationships}
          onEditClick={onEditClick}
          emptyMessage="No connected insider organizations"
        />
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationTabs;
