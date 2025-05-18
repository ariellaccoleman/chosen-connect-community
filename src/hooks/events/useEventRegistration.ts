
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { eventRegistrationApi } from '@/api/events/registrationApi';
import { logger } from '@/utils/logger';
import { RegistrationStatus } from '@/types/event';

/**
 * Hook for checking if the current user is registered for an event
 */
export const useEventRegistrationStatus = (eventId: string | undefined) => {
  const { user } = useAuth();
  const profileId = user?.id;
  
  const {
    data: isRegistered,
    isLoading,
    error
  } = useQuery({
    queryKey: ['event-registration', eventId, profileId],
    queryFn: async () => {
      if (!eventId || !profileId) return false;
      const response = await eventRegistrationApi.isUserRegistered(eventId, profileId);
      if (response.error) throw response.error;
      return response.data || false;
    },
    // Don't run the query if we don't have an event ID or profile ID
    enabled: !!eventId && !!profileId,
  });

  // Derive status from query state
  const status: RegistrationStatus = 
    isLoading ? 'loading' :
    isRegistered ? 'registered' : 
    'not_registered';

  return {
    isRegistered: !!isRegistered,
    status,
    isLoading,
    error,
  };
};

/**
 * Hook for managing event registration count
 */
export const useEventRegistrationCount = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event-registration-count', eventId],
    queryFn: async () => {
      if (!eventId) return 0;
      const response = await eventRegistrationApi.getRegistrationCount(eventId);
      if (response.error) throw response.error;
      return response.data || 0;
    },
    // Don't run the query if we don't have an event ID
    enabled: !!eventId,
  });
};

/**
 * Hook for managing event registration actions (register/cancel)
 */
export const useEventRegistrationActions = (eventId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileId = user?.id;

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!eventId || !profileId) {
        throw new Error("Missing event ID or user profile");
      }
      const result = await eventRegistrationApi.registerForEvent(eventId, profileId);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success("You've successfully registered for this event!");
      // Invalidate queries to update registration status and count
      queryClient.invalidateQueries({ queryKey: ['event-registration', eventId, profileId] });
      queryClient.invalidateQueries({ queryKey: ['event-registration-count', eventId] });
    },
    onError: (error) => {
      // Check if it's a duplicate registration error
      if (error instanceof Error && error.message.includes("already registered")) {
        toast.warning("You're already registered for this event.");
      } else {
        logger.error("Failed to register for event:", error);
        toast.error("Failed to register for event. Please try again.");
      }
    }
  });

  // Cancel registration mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!eventId || !profileId) {
        throw new Error("Missing event ID or user profile");
      }
      const result = await eventRegistrationApi.cancelRegistration(eventId, profileId);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success("Your registration has been canceled.");
      // Invalidate queries to update registration status and count
      queryClient.invalidateQueries({ queryKey: ['event-registration', eventId, profileId] });
      queryClient.invalidateQueries({ queryKey: ['event-registration-count', eventId] });
    },
    onError: (error) => {
      logger.error("Failed to cancel registration:", error);
      toast.error("Failed to cancel registration. Please try again.");
    }
  });

  return {
    register: registerMutation.mutate,
    cancelRegistration: cancelMutation.mutate,
    isRegistering: registerMutation.isPending,
    isCanceling: cancelMutation.isPending,
    error: registerMutation.error || cancelMutation.error,
  };
};
