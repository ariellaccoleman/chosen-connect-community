
import { useState, useEffect } from "react";
import { Navigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

// Import our new components
import AuthLayout from "@/components/auth/AuthLayout";
import AuthTabs from "@/components/auth/AuthTabs";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

type AuthMode = "login" | "signup" | "forgotPassword" | "resetPassword";

const Auth = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
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

  // Add debug logs
  console.log("Auth page - Auth state:", { user, loading, authMode });

  // Redirect if already logged in, but don't redirect if we're on the reset password page
  if (user && !loading && authMode !== "resetPassword") {
    console.log("Auth page - User is logged in, redirecting to dashboard");
    // Get the intended destination if available, otherwise go to dashboard
    const from = location.state?.from || "/dashboard";
    return <Navigate to={from} replace />;
  }

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
  
  return loading ? (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chosen-blue"></div>
    </div>
  ) : renderAuthContent();
};

export default Auth;
