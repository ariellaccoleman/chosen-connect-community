
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HubWithDetails } from '@/types';

interface HubCardProps {
  hub: HubWithDetails;
}

const HubCard: React.FC<HubCardProps> = ({ hub }) => {
  return (
    <Link to={`/hubs/${hub.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="pt-6">
          <CardTitle className="mb-2">{hub.name}</CardTitle>
          {hub.description && (
            <p className="text-muted-foreground line-clamp-2">{hub.description}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {hub.tag && (
            <Badge variant="outline" className="bg-primary-50 text-primary-700">
              {hub.tag.name}
            </Badge>
          )}
          
          {hub.is_featured && (
            <Badge variant="secondary">Featured</Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default HubCard;
