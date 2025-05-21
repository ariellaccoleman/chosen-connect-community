
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, StarOff } from 'lucide-react';
import { HubWithTag } from '@/types/hub';
import { useAuth } from '@/hooks/useAuth';
import TagBadge from '@/components/tags/TagBadge';

interface HubCardProps {
  hub: HubWithTag;
  onToggleFeatured?: (id: string, isFeatured: boolean) => void;
  isTogglingFeatured?: boolean;
}

const HubCard: React.FC<HubCardProps> = ({ 
  hub, 
  onToggleFeatured,
  isTogglingFeatured = false
}) => {
  const { isAdmin } = useAuth();
  
  const handleToggleFeatured = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFeatured) {
      onToggleFeatured(hub.id, !hub.is_featured);
    }
  };
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-xl">{hub.name}</CardTitle>
          {isAdmin && onToggleFeatured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFeatured}
              disabled={isTogglingFeatured}
              className="h-8 w-8 p-0"
              title={hub.is_featured ? "Remove from featured" : "Add to featured"}
            >
              {hub.is_featured ? (
                <Star className="h-4 w-4 text-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {hub.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <TagBadge
          name={hub.tag_name}
          entityType="hub"
          className="mt-2"
        />
        
        {hub.tag_description && (
          <p className="mt-3 text-sm text-muted-foreground">
            {hub.tag_description}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Link to={`/hubs/${hub.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Hub
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default HubCard;
