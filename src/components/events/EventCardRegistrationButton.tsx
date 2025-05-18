
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEventRegistrationStatus, useEventRegistrationActions } from '@/hooks/events';
import { CalendarPlus, Loader2, CalendarCheck } from 'lucide-react';

interface EventCardRegistrationButtonProps {
  eventId: string;
}

/**
 * A compact version of the registration button for use in event cards
 */
const EventCardRegistrationButton: React.FC<EventCardRegistrationButtonProps> = ({ eventId }) => {
  const { user, isAuthenticated } = useAuth();
  const { status } = useEventRegistrationStatus(eventId);
  const { register, isRegistering } = useEventRegistrationActions(eventId);

  // Handle click event without propagating to parent
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated) {
      register();
    }
  };
  
  // If not authenticated, show a disabled button
  if (!isAuthenticated) {
    return (
      <Button 
        disabled 
        variant="outline" 
        size="sm" 
        className="pointer-events-auto"
        onClick={handleClick}
      >
        <CalendarPlus className="mr-2 h-4 w-4" />
        Sign in to register
      </Button>
    );
  }

  // Show appropriate button based on registration status
  if (status === 'loading') {
    return (
      <Button 
        disabled 
        variant="outline" 
        size="sm"
        className="pointer-events-auto"
        onClick={handleClick}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }
  
  if (status === 'registered') {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="bg-green-50 text-green-700 border-green-200 pointer-events-auto"
        onClick={handleClick}
      >
        <CalendarCheck className="mr-2 h-4 w-4" />
        Registered
      </Button>
    );
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      className="bg-chosen-blue text-white hover:bg-chosen-navy pointer-events-auto"
      disabled={isRegistering}
      onClick={handleClick}
    >
      {isRegistering ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CalendarPlus className="mr-2 h-4 w-4" />
      )}
      Register
    </Button>
  );
};

export default EventCardRegistrationButton;
