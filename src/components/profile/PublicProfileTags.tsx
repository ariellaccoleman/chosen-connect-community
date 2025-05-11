
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TagList from "@/components/tags/TagList";
import { TagAssignment } from "@/utils/tagUtils";

interface PublicProfileTagsProps {
  tagAssignments: TagAssignment[];
  isLoading: boolean;
}

const PublicProfileTags = ({ tagAssignments, isLoading }: PublicProfileTagsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Skills & Tags</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <TagList tagAssignments={tagAssignments} />
        )}
      </CardContent>
    </Card>
  );
};

export default PublicProfileTags;
