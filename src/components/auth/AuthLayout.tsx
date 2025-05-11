
import { ReactNode } from "react";
import { Globe } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";

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
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 flex items-center space-x-2">
        <Globe className="h-10 w-10 text-chosen-blue" />
        <h1 className="text-3xl font-bold text-chosen-blue font-heading">CHOSEN</h1>
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-center text-2xl">{title}</CardTitle>}
            {description && <CardDescription className="text-center">{description}</CardDescription>}
          </CardHeader>
        )}
        
        <CardContent>
          {children}
        </CardContent>
        
        {showFooter && (
          <CardFooter className="flex flex-col space-y-2 mt-6">
            <p className="text-sm text-gray-500 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AuthLayout;
