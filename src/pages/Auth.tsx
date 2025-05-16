import { useState, useEffect } from "react";
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
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  
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

  // Add debug logs for redirect state
  console.log("Auth page - Auth state:", { 
    user, 
    loading, 
    authMode,
    redirectState: location.state,
    pathname: location.pathname 
  });

  // Handle authenticated user redirection here
  useEffect(() => {
    if (user && !loading) {
      const redirectTo = location.state?.redirectTo || "/dashboard";
      console.log("Auth page: User is authenticated, redirecting to", redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const handleTabChange = (value: string) => {
    setAuthMode(value as AuthMode);
  };

  const handleForgotPasswordClick = () => {
    setAuthMode("forgotPassword");
  };

  const handleBackToLogin = () => {
    setAuthMode("login");
  };

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
  
  // Only show loading state if we're checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chosen-blue"></div>
      </div>
    );
  }

  // If user is already authenticated, we'll let the useEffect handle redirect
  // Otherwise show the auth content
  return !user ? renderAuthContent() : null;
};

export default Auth;
