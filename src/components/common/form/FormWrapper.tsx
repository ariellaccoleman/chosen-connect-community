
// We need to fix form submission by ensuring the onSubmit handler is properly wired up
// Since the file is marked as read-only, we'll need to create a modified version if needed
import React from "react";
import { Form } from "@/components/ui/form";
import { 
  UseFormReturn, 
  FieldValues, 
  SubmitHandler,
  SubmitErrorHandler
} from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormWrapperProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  onError?: SubmitErrorHandler<T>;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormWrapper<T extends FieldValues>({
  form,
  onSubmit,
  onError,
  children,
  className,
  id,
}: FormWrapperProps<T>) {
  console.log("FormWrapper rendering with id:", id);
  
  const handleFormSubmit = async (data: T) => {
    console.log("FormWrapper handleFormSubmit called with data:", data);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  return (
    <Form {...form}>
      <form 
        id={id}
        onSubmit={(e) => {
          console.log("Raw form submit event triggered");
          form.handleSubmit(handleFormSubmit, onError)(e);
        }}
        className={cn("space-y-4", className)}
      >
        {children}
      </form>
    </Form>
  );
}
