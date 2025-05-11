
import React from "react";
import { Form } from "@/components/ui/form";
import { useFormError } from "@/hooks/useFormError";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UseFormReturn } from "react-hook-form";

interface FormWrapperProps<TFormValues> {
  form: UseFormReturn<TFormValues>;
  onSubmit: (values: TFormValues) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized form wrapper component that handles form submission and error display
 */
export function FormWrapper<TFormValues>({
  form,
  onSubmit,
  children,
  className = "",
}: FormWrapperProps<TFormValues>) {
  const { error, handleError } = useFormError();

  const handleFormSubmit = async (data: TFormValues) => {
    try {
      await onSubmit(data);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className={className}>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {children}
      </form>
    </Form>
  );
}
