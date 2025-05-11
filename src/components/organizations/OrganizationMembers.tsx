
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { formatConnectionType } from "@/utils/formatters/organizationFormatters";

interface OrganizationMembersProps {
  organizationId: string;
}

// Helper function to format names
const formatNames = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return "Unknown";
  return `${firstName || ''} ${lastName || ''}`.trim();
};

const OrganizationMembers = ({ organizationId }: OrganizationMembersProps) => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ProfileOrganizationRelationshipWithDetails[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('org_relationships')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('organization_id', organizationId);
          
        if (error) throw error;
        
        // Filter out relationships without a profile
        const validMembers = data?.filter(rel => rel.profile) || [];
        
        // Transform the data to match ProfileOrganizationRelationshipWithDetails
        const formattedMembers = validMembers.map(rel => ({
          ...rel,
          // Add organization property (required for the type)
          organization: {
            id: organizationId,
            name: '',  // These fields are required but not used in the member display
            description: null,
            website_url: null,
            logo_url: null,
            logo_api_url: null,
            created_at: '',
            location_id: null
          }
        })) as ProfileOrganizationRelationshipWithDetails[];
        
        setMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching organization members:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (organizationId) {
      fetchMembers();
    }
  }, [organizationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
      </CardHeader>
      <CardContent>
        {members.length > 0 ? (
          <div className="space-y-4">
            {members.map((relationship) => (
              <MemberRow 
                key={relationship.id} 
                relationship={relationship} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No members found for this organization.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Member row component
interface MemberRowProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
}

const MemberRow = ({ relationship }: MemberRowProps) => {
  // Access the profile from the relationship object (via supabase join)
  const profile = (relationship as any).profile;  
  if (!profile) return null;
  
  const fullName = formatNames(profile.first_name, profile.last_name);
  const initials = (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '');
  const connectionType = formatConnectionType(relationship.connection_type);
  
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <Link 
          to={`/profile/${profile.id}`} 
          className="font-medium text-blue-600 hover:underline"
        >
          {fullName}
        </Link>
        <div className="text-sm text-muted-foreground">
          {connectionType}
          {relationship.department && ` • ${relationship.department}`}
        </div>
      </div>
    </div>
  );
};

export default OrganizationMembers;
