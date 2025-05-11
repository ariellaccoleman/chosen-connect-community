
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
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

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/dashboard" />;
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
  
  return loading ? null : renderAuthContent();
};

export default Auth;
