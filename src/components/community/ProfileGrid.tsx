
import { ProfileWithDetails } from "@/types";
import ProfileCard from "./ProfileCard";
import ProfileCardSkeleton from "./ProfileCardSkeleton";

interface ProfileGridProps {
  profiles: ProfileWithDetails[] | undefined;
  isLoading: boolean;
  searchQuery: string;
}

const ProfileGrid = ({ profiles, isLoading, searchQuery }: ProfileGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {searchQuery
            ? "No members found matching your search."
            : "No approved community members found. Members need to be approved to appear in the directory."}
        </p>
        <p className="text-gray-400 mt-2">
          Make sure profiles are marked as approved in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
};

export default ProfileGrid;
