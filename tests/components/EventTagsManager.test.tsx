import React from 'react';
import { render, screen } from '@testing-library/react';
import EventTagsManager from '@/components/events/form/EventTagsManager';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import * as AuthHook from '@/hooks/useAuth';

// Mock react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
  Navigate: jest.fn(({ to, state }) => (
    <div data-testid="mock-navigate">
      Redirected to {to} with state: {JSON.stringify(state)}
    </div>
  ))
}));

// Mock EntityTagManager component
jest.mock('@/components/tags/EntityTagManager', () => ({
  __esModule: true,
  default: () => <div data-testid="entity-tag-manager">Entity Tag Manager</div>
}));

// Create QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
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

describe.skip('EventTagsManager Component', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockEventId = 'event-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('redirects unauthenticated users to auth page', () => {
    // Mock unauthenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: false,
      authenticated: false
    }));
    
    render(<EventTagsManager eventId={mockEventId} />, { wrapper: Wrapper });
    
    // Check for redirect with correct 'from' state
    expect(screen.getByTestId('mock-navigate')).toBeInTheDocument();
    expect(screen.getByText(/Redirected to \/auth with state:/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`events\\/${mockEventId}\\/tags`))).toBeInTheDocument();
  });
  
  test('shows loading skeleton while checking authentication', () => {
    // Mock loading state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: null,
      loading: true,
      authenticated: false
    }));
    
    render(<EventTagsManager eventId={mockEventId} />, { wrapper: Wrapper });
    
    // Verify skeleton components are shown during loading
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  test('renders the tag manager for authenticated users', () => {
    // Mock authenticated state
    jest.spyOn(AuthHook, 'useAuth').mockImplementation(() => ({
      user: mockUser,
      loading: false,
      authenticated: true
    }));
    
    render(<EventTagsManager eventId={mockEventId} />, { wrapper: Wrapper });
    
    // Check for the heading and tag manager
    expect(screen.getByText('Manage Event Tags')).toBeInTheDocument();
    expect(screen.getByTestId('entity-tag-manager')).toBeInTheDocument();
    expect(screen.getByText('Go to Events')).toBeInTheDocument();
  });
});
