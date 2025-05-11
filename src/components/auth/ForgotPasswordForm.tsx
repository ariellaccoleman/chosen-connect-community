
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackClick: () => void;
}

const ForgotPasswordForm = ({ onBackClick }: ForgotPasswordFormProps) => {
  const { forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
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

  return (
    <>
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={onBackClick} 
          className="mb-4"
        >
          &larr; Back to Login
        </Button>
        <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
        <p className="text-gray-600 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
};

export default ForgotPasswordForm;
