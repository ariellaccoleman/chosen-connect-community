import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfileQueries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import OrganizationSection from "@/components/dashboard/OrganizationSection";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizationQueries";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile(user?.id, user);
  
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Fetching your profile details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <Skeleton className="h-9 w-9 rounded-full" />
              </Avatar>
              <Skeleton className="ml-4 h-4 w-[200px]" />
            </div>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              Please complete your profile to get the most out of our platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              It looks like you haven't set up your profile yet.{" "}
              <button
                onClick={() => navigate("/profile/edit")}
                className="text-blue-500 hover:underline"
              >
                Edit your profile here
              </button>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user role from user_metadata
  const userRole = user?.user_metadata?.role || "Not specified";

  return (
    <div className="container mx-auto py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Welcome, {profile.first_name} {profile.last_name}!
          </CardTitle>
          <CardDescription>
            Here's a summary of your profile and connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile.avatar_url || ""} alt="Your Avatar" />
              <AvatarFallback>
                {profile.first_name?.charAt(0)}
                {profile.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <p className="text-sm">
            You are currently connected as a{" "}
            <span className="font-semibold">
              {userRole}
            </span>
            .
          </p>
        </CardContent>
      </Card>

      <OrganizationSection 
        relationships={relationships}
        isLoading={isLoadingRelationships}
      />
    </div>
  );
};

export default Dashboard;
