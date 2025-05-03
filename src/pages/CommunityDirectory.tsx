
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { ProfileWithDetails } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Use the current user's profile separately to ensure we always display it
  const { data: currentUserProfile } = useProfiles(user?.id || "");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["community-profiles", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          location:locations(*)
        `);

      // Apply search filter if query exists
      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.order("first_name");

      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }

      return data.map((profile: ProfileWithDetails) => {
        // Format full name
        profile.full_name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");

        // Format location if available
        if (profile.location) {
          profile.location.formatted_location = [
            profile.location.city,
            profile.location.region,
            profile.location.country,
          ]
            .filter(Boolean)
            .join(", ");
        }

        return profile;
      });
    },
    enabled: true, // Always enable this query to ensure we fetch profiles
  });

  // Combine and deduplicate profiles
  const allProfiles = profiles || [];

  return (
    <DashboardLayout>
      <div className="container max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Community Directory
        </h1>

        <div className="relative mb-8">
          <Input
            type="text"
            placeholder="Search community members..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : allProfiles && allProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? "No members found matching your search."
                : "No community members found."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const ProfileCard = ({ profile }: { profile: ProfileWithDetails }) => {
  const getInitials = () => {
    if (!profile || !profile.first_name) return "U";

    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="bg-chosen-blue text-white text-xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {profile.full_name || "Anonymous User"}
          </h3>
          {profile.headline && (
            <p className="text-sm text-gray-600 truncate mb-1">
              {profile.headline}
            </p>
          )}
          {profile.location && (
            <p className="text-xs text-gray-500">
              {profile.location.formatted_location}
            </p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.linkedin_url && (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            LinkedIn
          </a>
        )}
        {profile.twitter_url && (
          <a
            href={profile.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Twitter
          </a>
        )}
        {profile.website_url && (
          <a
            href={profile.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Website
          </a>
        )}
      </div>
    </div>
  );
};

const ProfileCardSkeleton = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mt-4" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
};

export default CommunityDirectory;
