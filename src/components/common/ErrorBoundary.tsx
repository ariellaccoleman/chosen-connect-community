
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  name?: string; // For identifying which boundary caught the error
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const ErrorFallback = ({ error, resetError }: { error: Error | null; resetError: () => void }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    resetError();
  };

  return (
    <Card className="p-6 my-4 max-w-xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
        <p className="text-gray-600">
          There was an error rendering this page. Our team has been notified.
        </p>
        {error && (
          <div className="bg-gray-50 p-4 rounded border text-sm">
            <p className="font-mono text-red-500">{error.message}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={resetError}>Try again</Button>
          <Button variant="outline" onClick={handleGoHome}>
            Go to homepage
          </Button>
        </div>
      </div>
    </Card>
  );
};

// The actual error boundary component
class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const boundaryName = this.props.name || 'unnamed boundary';
    logger.error(`Error caught by ${boundaryName}:`, error);
    logger.error('Component stack:', errorInfo.componentStack);
    
    // Here you could send to an error reporting service
  }

  resetBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetError={this.resetBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

// This wrapper exists to handle the navigate hook which can't be used in class components
const ErrorBoundary = (props: ErrorBoundaryProps) => {
  return <ErrorBoundaryBase {...props} />;
};

export default ErrorBoundary;
