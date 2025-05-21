
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HubWithDetails } from '@/types/hub';
import { useAuth } from '@/hooks/useAuth';

interface HubCardProps {
  hub: HubWithDetails;
  onToggleFeatured?: (id: string, isFeatured: boolean) => void;
  isAdmin?: boolean;
}

const HubCard: React.FC<HubCardProps> = ({ 
  hub, 
  onToggleFeatured,
  isAdmin = false 
}) => {
  const { isAdmin: userIsAdmin } = useAuth();
  const showAdminControls = isAdmin && userIsAdmin;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{hub.name}</CardTitle>
          {hub.is_featured && (
            <div className="flex items-center text-amber-500">
              <Star className="h-5 w-5 fill-amber-500" />
              <span className="ml-1 text-xs font-medium">Featured</span>
            </div>
          )}
        </div>
        {hub.tag && (
          <CardDescription>
            Tag: {hub.tag.name}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">
          {hub.description || 'No description available'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {/* Temporarily link to the hubs page until hub detail pages are implemented */}
        <Button asChild variant="default">
          <Link to="/hubs">View Hub</Link>
        </Button>
        
        {showAdminControls && onToggleFeatured && (
          <Button 
            variant="outline" 
            onClick={() => onToggleFeatured(hub.id, !hub.is_featured)}
            className="flex items-center gap-1"
          >
            <Star className={`h-4 w-4 ${hub.is_featured ? 'fill-amber-500' : ''}`} />
            {hub.is_featured ? 'Unfeature' : 'Feature'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default HubCard;
