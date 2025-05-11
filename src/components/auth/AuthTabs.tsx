
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

interface AuthTabsProps {
  activeTab: "login" | "signup";
  onTabChange: (value: string) => void;
  onForgotPasswordClick: () => void;
}

const AuthTabs = ({ activeTab, onTabChange, onForgotPasswordClick }: AuthTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login" className="px-1">
        <LoginForm onForgotPasswordClick={onForgotPasswordClick} />
      </TabsContent>
      
      <TabsContent value="signup" className="px-1">
        <SignupForm />
      </TabsContent>
    </Tabs>
  );
};

export default AuthTabs;
