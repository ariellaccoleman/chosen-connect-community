
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEventRegistrationStatus, useEventRegistrationActions, useEventRegistrationCount } from '@/hooks/events';
import { CalendarPlus, Loader2, CalendarX, CalendarCheck } from 'lucide-react';

interface EventRegistrationButtonProps {
  eventId: string;
}

const EventRegistrationButton: React.FC<EventRegistrationButtonProps> = ({ eventId }) => {
  const { user, isAuthenticated } = useAuth();
  const { status } = useEventRegistrationStatus(eventId);
  const { register, cancelRegistration, isRegistering, isCanceling } = useEventRegistrationActions(eventId);
  const { data: registrationCount = 0 } = useEventRegistrationCount(eventId);

  // If not authenticated, show a disabled button with login message
  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        <Button 
          disabled 
          className="w-full bg-chosen-blue hover:bg-chosen-navy"
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Sign in to register
        </Button>
      </div>
    );
  }

  // Show appropriate button based on registration status
  return (
    <div className="space-y-2">
      {status === 'loading' ? (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking registration...
        </Button>
      ) : status === 'registered' ? (
        <div className="space-y-2">
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md flex items-center">
            <CalendarCheck className="mr-2 h-5 w-5" />
            <span className="font-medium">You're registered!</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => cancelRegistration()} 
            disabled={isCanceling}
            className="w-full"
          >
            {isCanceling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarX className="mr-2 h-4 w-4" />
            )}
            Cancel registration
          </Button>
        </div>
      ) : (
        <Button 
          onClick={() => register()} 
          disabled={isRegistering}
          className="w-full bg-chosen-blue hover:bg-chosen-navy"
        >
          {isRegistering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="mr-2 h-4 w-4" />
          )}
          Register for this event
        </Button>
      )}
      
      {/* Display registration count */}
      <p className="text-sm text-center text-gray-600">
        {registrationCount} {registrationCount === 1 ? 'person' : 'people'} registered
      </p>
    </div>
  );
};

export default EventRegistrationButton;
