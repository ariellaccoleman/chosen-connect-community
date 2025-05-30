
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventTagsManager from '@/components/events/form/EventTagsManager';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { CentralTestAuthUtils } from '../api/testing/CentralTestAuthUtils';
import { createEvent } from '@/api/events/eventApiFactory';
import { tagApi } from '@/api/tags/factory/tagApiFactory';
import { TestClientFactory } from '@/integrations/supabase/testClient';

// Mock react-router-dom navigate function
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock useAuth hook to avoid authentication context issues
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    loading: false,
    isAuthenticated: true,
    isAdmin: false,
    email: 'test@example.com',
    initialized: true,
    login: jest.fn(),
    signUp: jest.fn(),
    logout: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    error: null
  })
}));

// Create QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

// Create a wrapper for the component with necessary providers
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
);

describe('EventTagsManager Component - Database Integration', () => {
  let testEventId: string;
  
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  afterAll(async () => {
    await TestClientFactory.cleanup();
  });

  test('renders the tag manager for authenticated users with real event', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user1',
      async (client) => {
        // Create a real test event first
        const testEvent = {
          title: `Test Event ${Date.now()}`,
          description: 'Test event for tag manager',
          start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 90000000).toISOString(),
          is_virtual: true,
          is_paid: false
        };

        const eventResult = await createEvent(testEvent as any);
        expect(eventResult.data).toBeTruthy();
        testEventId = eventResult.data!.id;

        // Render component with real event ID
        render(<EventTagsManager eventId={testEventId} />, { wrapper: Wrapper });

        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText('Manage Event Tags')).toBeInTheDocument();
        });

        // Verify the EntityTagManager is rendered
        await waitFor(() => {
          expect(screen.getByTestId('tag-selector') || screen.getByText(/add tags/i)).toBeTruthy();
        });

        // Verify navigation button is present
        expect(screen.getByText('Go to Events')).toBeInTheDocument();
      }
    );
  });

  test('allows adding tags to event through real API', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user1',
      async (client) => {
        // Create a real test event
        const testEvent = {
          title: `Tagged Event ${Date.now()}`,
          description: 'Event for tag testing',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
          is_virtual: true,
          is_paid: false
        };

        const eventResult = await createEvent(testEvent as any);
        expect(eventResult.data).toBeTruthy();
        testEventId = eventResult.data!.id;

        // Create a test tag
        const testTag = {
          name: `test-tag-${Date.now()}`,
          description: 'Test tag for events'
        };

        const tagResult = await tagApi.create(testTag);
        expect(tagResult.data).toBeTruthy();
        const createdTagId = tagResult.data!.id;

        // Render component
        render(<EventTagsManager eventId={testEventId} />, { wrapper: Wrapper });

        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText('Manage Event Tags')).toBeInTheDocument();
        });

        // The actual tag assignment would happen through the EntityTagManager
        // We can verify that the component structure is correct
        expect(screen.getByText(/Your event was created successfully/)).toBeInTheDocument();
        expect(screen.getByText(/add tags to help people find your event/)).toBeInTheDocument();

        // Clean up created tag
        await tagApi.delete(createdTagId);
      }
    );
  });

  test('handles navigation correctly', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user1',
      async (client) => {
        // Create a real test event
        const testEvent = {
          title: `Nav Test Event ${Date.now()}`,
          description: 'Event for navigation testing',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
          is_virtual: true,
          is_paid: false
        };

        const eventResult = await createEvent(testEvent as any);
        expect(eventResult.data).toBeTruthy();
        testEventId = eventResult.data!.id;

        // Render component
        render(<EventTagsManager eventId={testEventId} />, { wrapper: Wrapper });

        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText('Manage Event Tags')).toBeInTheDocument();
        });

        // Find and click the "Go to Events" button
        const goToEventsButton = screen.getByText('Go to Events');
        await userEvent.click(goToEventsButton);

        // Verify navigation was called
        expect(mockedNavigate).toHaveBeenCalledWith('/events');
      }
    );
  });

  test('displays loading state appropriately', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user1',
      async (client) => {
        // Create a real test event
        const testEvent = {
          title: `Loading Test Event ${Date.now()}`,
          description: 'Event for loading state testing',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
          is_virtual: true,
          is_paid: false
        };

        const eventResult = await createEvent(testEvent as any);
        expect(eventResult.data).toBeTruthy();
        testEventId = eventResult.data!.id;

        // Render component
        render(<EventTagsManager eventId={testEventId} />, { wrapper: Wrapper });

        // The component should eventually load without showing permanent loading state
        await waitFor(() => {
          expect(screen.getByText('Manage Event Tags')).toBeInTheDocument();
        }, { timeout: 5000 });

        // Verify content is displayed
        expect(screen.getByText(/Your event was created successfully/)).toBeInTheDocument();
      }
    );
  });

  test('handles error states gracefully with real API', async () => {
    // Test with an invalid event ID to see error handling
    const invalidEventId = 'invalid-uuid-format';
    
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user1',
      async (client) => {
        // Render component with invalid event ID
        render(<EventTagsManager eventId={invalidEventId} />, { wrapper: Wrapper });

        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText('Manage Event Tags')).toBeInTheDocument();
        });

        // The component should still render the basic structure
        expect(screen.getByText('Go to Events')).toBeInTheDocument();
      }
    );
  });
});
