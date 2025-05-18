
import React from 'react';
import { EventRegistration } from '@/types/event';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Loader2 } from 'lucide-react';

interface EventRegistrantsListProps {
  eventId: string;
  isHost: boolean;
  registrants: EventRegistration[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Component to display the list of users registered for an event
 * Only visible to event hosts
 */
const EventRegistrantsList: React.FC<EventRegistrantsListProps> = ({ 
  eventId, 
  isHost, 
  registrants, 
  isLoading,
  error 
}) => {
  // Only hosts can see the list
  if (!isHost) return null;

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-chosen-blue" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Could not load registrants</CardTitle>
          <CardDescription className="text-red-600">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If no registrants yet
  if (registrants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-chosen-blue" />
            No Registrations Yet
          </CardTitle>
          <CardDescription>
            No one has registered for this event yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show the registrants list
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCheck className="mr-2 h-5 w-5 text-chosen-blue" />
          Registered Attendees ({registrants.length})
        </CardTitle>
        <CardDescription>
          These people have registered for your event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {registrants.map((registration) => (
            <div key={registration.id} className="flex items-center space-x-4 p-3 rounded-md hover:bg-gray-50">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={registration.profile?.avatar_url || ''} 
                  alt={`${registration.profile?.first_name || ''} ${registration.profile?.last_name || ''}`} 
                />
                <AvatarFallback>
                  {registration.profile?.first_name?.[0] || ''}
                  {registration.profile?.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {registration.profile ? 
                    `${registration.profile.first_name || ''} ${registration.profile.last_name || ''}` : 
                    'Unknown User'}
                </div>
                {registration.profile?.headline && (
                  <div className="text-sm text-gray-500">{registration.profile.headline}</div>
                )}
                <div className="text-xs text-gray-400">
                  Registered {format(new Date(registration.created_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventRegistrantsList;
