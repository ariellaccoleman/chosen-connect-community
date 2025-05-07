
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Briefcase, Link } from "lucide-react";
import OrganizationCard from "@/components/organizations/OrganizationCard";
import { formatWebsiteUrl } from "@/utils/formatters";
import { formatLocationWithDetails } from "@/utils/adminFormatters";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile(user?.id);
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);

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

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="mb-4">Your profile is not complete. Please set up your profile to continue.</p>
          <Button onClick={() => navigate("/profile")} className="bg-chosen-blue">
            Set Up Profile
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getInitials = () => {
    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
  };

  const currentOrgs = formattedRelationships.filter(rel => rel.connection_type === 'current');
  const formerOrgs = formattedRelationships.filter(rel => rel.connection_type === 'former');
  const allyOrgs = formattedRelationships.filter(rel => rel.connection_type === 'ally');

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 font-heading">Your Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-12">
          {/* Profile Summary Card */}
          <Card className="md:col-span-4">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Profile</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => navigate("/profile")}
                  className="text-chosen-blue hover:text-chosen-navy"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-chosen-gold text-chosen-navy text-lg">
                    {getInitials() || "?"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                {profile.headline && (
                  <p className="text-gray-600 text-center mt-1">{profile.headline}</p>
                )}
              </div>
              
              {profile.location && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Location</p>
                  <p>{profile.location.formatted_location}</p>
                </div>
              )}
              
              {profile.bio && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
              
              <div className="flex flex-col space-y-2 mt-4">
                {profile.linkedin_url && (
                  <a 
                    href={formatWebsiteUrl(profile.linkedin_url)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-chosen-blue hover:text-chosen-navy break-all"
                  >
                    <Link className="h-4 w-4 mr-2 flex-shrink-0" />
                    LinkedIn
                  </a>
                )}
                {profile.twitter_url && (
                  <a 
                    href={formatWebsiteUrl(profile.twitter_url)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-chosen-blue hover:text-chosen-navy break-all"
                  >
                    <Link className="h-4 w-4 mr-2 flex-shrink-0" />
                    Twitter
                  </a>
                )}
                {profile.website_url && (
                  <a 
                    href={formatWebsiteUrl(profile.website_url)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-chosen-blue hover:text-chosen-navy break-all"
                  >
                    <Link className="h-4 w-4 mr-2 flex-shrink-0" />
                    Website
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Organizations Section */}
          <div className="md:col-span-8 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle>Your Organizations</CardTitle>
                  <Button 
                    onClick={() => navigate("/organizations/manage")} 
                    className="bg-chosen-blue hover:bg-chosen-navy w-full sm:w-auto"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Manage Organizations
                  </Button>
                </div>
                <CardDescription>
                  Organizations you're connected with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRelationships ? (
                  <p>Loading organizations...</p>
                ) : formattedRelationships.length > 0 ? (
                  <div className="space-y-6">
                    {currentOrgs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Current</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {currentOrgs.map(relationship => (
                            <OrganizationCard 
                              key={relationship.id} 
                              relationship={relationship} 
                              showActions={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formerOrgs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Former</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {formerOrgs.map(relationship => (
                            <OrganizationCard 
                              key={relationship.id} 
                              relationship={relationship} 
                              showActions={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {allyOrgs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Allied</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {allyOrgs.map(relationship => (
                            <OrganizationCard 
                              key={relationship.id} 
                              relationship={relationship} 
                              showActions={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">You haven't added any organizations yet</p>
                    <Button 
                      onClick={() => navigate("/organizations")}
                      className="bg-chosen-blue hover:bg-chosen-navy"
                    >
                      Browse Organizations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
