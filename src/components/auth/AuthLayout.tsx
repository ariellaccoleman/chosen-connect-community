
import { ReactNode } from "react";
import { Globe } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
}

const AuthLayout = ({ 
  children, 
  title = "Welcome to CHOSEN", 
  description = "A global professional community for Jews and pro-Israel individuals",
  showFooter = true 
}: AuthLayoutProps) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-4 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-800'
    } transition-colors duration-200`}>
      <div className="mb-8 flex items-center space-x-2">
        <Globe className="h-10 w-10 text-chosen-blue" />
        <h1 className="text-3xl font-bold text-chosen-blue font-heading">CHOSEN</h1>
      </div>
      
      <Card className={`w-full max-w-md shadow-lg ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : ''
      }`}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-center text-2xl">{title}</CardTitle>}
            {description && <CardDescription className={`text-center ${
              isDarkMode ? 'text-gray-300' : ''
            }`}>{description}</CardDescription>}
          </CardHeader>
        )}
        
        <CardContent>
          {children}
        </CardContent>
        
        {showFooter && (
          <CardFooter className="flex flex-col space-y-2 mt-6">
            <p className={`text-sm text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AuthLayout;
