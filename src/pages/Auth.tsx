
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

// Import our components
import AuthLayout from "@/components/auth/AuthLayout";
import AuthTabs from "@/components/auth/AuthTabs";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

type AuthMode = "login" | "signup" | "forgotPassword" | "resetPassword";

const Auth = () => {
  const { user, loading, initialized } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const redirectChecked = useRef(false);
  
  // Get the intended destination from location state
  const from = location.state?.from || "/dashboard";
  
  // If user is already authenticated, redirect to the intended destination with debouncing
  useEffect(() => {
    // Only run this effect when we have definitive authentication information
    // and haven't already initiated a redirect
    if (user && initialized && !loading && !redirectChecked.current) {
      // Mark that we've checked for redirect
      redirectChecked.current = true;
      
      // Increase debounce delay to allow auth state to stabilize
      const timer = setTimeout(() => {
        console.log("Auth page: User is authenticated, redirecting to", from);
        navigate(from, { replace: true });
      }, 300); // Increased from 150ms to 300ms
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate, from, initialized]);
  
  // Check for password reset, email confirmation, or signup tab parameters
  useEffect(() => {
    if (searchParams.has('reset')) {
      setAuthMode("resetPassword");
    } else if (searchParams.has('confirmation')) {
      toast.info("Please check your email to confirm your account");
    } else if (searchParams.has('tab') && searchParams.get('tab') === 'signup') {
      setAuthMode("signup");
    }
  }, [searchParams]);

  // Add debug logs
  console.log("Auth page:", { 
    user: !!user, 
    loading, 
    initialized,
    authMode,
    from,
    pathname: location.pathname,
    redirectChecked: redirectChecked.current
  });

  const handleTabChange = (value: string) => {
    setAuthMode(value as AuthMode);
  };

  const handleForgotPasswordClick = () => {
    setAuthMode("forgotPassword");
  };

  const handleBackToLogin = () => {
    setAuthMode("login");
  };

  // If still loading, auth not initialized, or user is authenticated (redirect is handled by useEffect)
  if (loading || !initialized || (user && redirectChecked.current)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chosen-blue"></div>
      </div>
    );
  }

  // Render different components based on the authentication mode
  const renderAuthContent = () => {
    switch (authMode) {
      case "forgotPassword":
        return (
          <AuthLayout
            title=""
            description=""
            showFooter={false}
          >
            <ForgotPasswordForm onBackClick={handleBackToLogin} />
          </AuthLayout>
        );
      case "resetPassword":
        return (
          <AuthLayout
            title=""
            description=""
            showFooter={false}
          >
            <ResetPasswordForm />
          </AuthLayout>
        );
      default:
        return (
          <AuthLayout>
            <AuthTabs 
              activeTab={authMode as "login" | "signup"} 
              onTabChange={handleTabChange} 
              onForgotPasswordClick={handleForgotPasswordClick}
            />
          </AuthLayout>
        );
    }
  };
  
  return renderAuthContent();
};

export default Auth;
