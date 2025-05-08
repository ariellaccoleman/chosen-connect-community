import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfileMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = loginSchema.extend({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const Auth = () => {
  const { user, loading, signIn, signUp, forgotPassword, resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgotPassword" | "resetPassword">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateProfile = useUpdateProfile();
  
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

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const resetPasswordForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginValues) => {
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupValues) => {
    setIsSubmitting(true);
    try {
      // First sign up the user and get the returned data
      const result = await signUp(data.email, data.password, data.firstName, data.lastName);
      
      // If signup was successful and we have a user ID, ensure profile record exists
      if (result && result.user?.id) {
        try {
          // Create/update profile with first and last name
          await updateProfile.mutateAsync({
            profileId: result.user.id,
            profileData: {
              first_name: data.firstName,
              last_name: data.lastName,
              email: data.email
            }
          });
          console.log('Profile created/updated successfully during signup');
        } catch (profileError) {
          console.error('Error creating profile during signup:', profileError);
          // We don't want to block signup if profile creation fails
          // The edge function should handle this as a fallback
        }
      }
      
      // After successful signup, switch to login mode
      setAuthMode("login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onForgotPasswordSubmit = async (data: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email);
      // No need to switch modes, toast message will inform user to check email
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onResetPasswordSubmit = async (data: ResetPasswordValues) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.password);
      // Auth hook will navigate after success
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }

  const renderLoginForm = () => (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={loginForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-right">
          <Button 
            variant="link" 
            type="button" 
            className="p-0 h-auto text-sm"
            onClick={() => setAuthMode("forgotPassword")}
          >
            Forgot password?
          </Button>
        </div>
        
        <Button type="submit" className="w-full bg-chosen-blue" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
  
  const renderSignupForm = () => (
    <Form {...signupForm}>
      <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={signupForm.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={signupForm.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={signupForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={signupForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={signupForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-chosen-blue" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
  
  const renderForgotPasswordForm = () => (
    <>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => setAuthMode("login")} 
          className="mb-4"
        >
          &larr; Back to Login
        </Button>
        <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
        <p className="text-gray-600 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      <Form {...forgotPasswordForm}>
        <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
          <FormField
            control={forgotPasswordForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-chosen-blue" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>
    </>
  );
  
  const renderResetPasswordForm = () => (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
        <p className="text-gray-600 mb-4">
          Please enter your new password below.
        </p>
      </div>
      
      <Form {...resetPasswordForm}>
        <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
          <FormField
            control={resetPasswordForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={resetPasswordForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-chosen-blue" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Reset Password"}
          </Button>
        </form>
      </Form>
    </>
  );

  const renderContent = () => {
    if (authMode === "forgotPassword") {
      return renderForgotPasswordForm();
    } else if (authMode === "resetPassword") {
      return renderResetPasswordForm();
    } else {
      return (
        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="px-1">
            {renderLoginForm()}
          </TabsContent>
          
          <TabsContent value="signup" className="px-1">
            {renderSignupForm()}
          </TabsContent>
        </Tabs>
      );
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 flex items-center space-x-2">
        <Globe className="h-10 w-10 text-chosen-blue" />
        <h1 className="text-3xl font-bold text-chosen-blue font-heading">CHOSEN</h1>
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          {authMode !== "forgotPassword" && authMode !== "resetPassword" && (
            <>
              <CardTitle className="text-center text-2xl">Welcome to CHOSEN</CardTitle>
              <CardDescription className="text-center">
                A global professional community for Jews and pro-Israel individuals
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {renderContent()}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 mt-6">
          <p className="text-sm text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
