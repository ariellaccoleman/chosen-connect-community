
import React from "react";
import { Form } from "@/components/ui/form";
import { 
  UseFormReturn, 
  FieldValues, 
  SubmitHandler,
  SubmitErrorHandler
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";

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
    logger.info("FormWrapper handleFormSubmit called with data:", data);
    try {
      console.log("FormWrapper - Calling onSubmit with data:", data);
      logger.info("FormWrapper - Calling onSubmit with data");
      await onSubmit(data);
      console.log("FormWrapper - onSubmit completed successfully");
      logger.info("FormWrapper - onSubmit completed successfully");
    } catch (error) {
      console.error("Error in form submission:", error);
      logger.error("Error in form submission:", error);
    }
  };

  return (
    <Form {...form}>
      <form 
        id={id}
        onSubmit={(e) => {
          console.log("Raw form submit event triggered");
          logger.info("Form submit event triggered");
          e.preventDefault(); // Prevent default form submission
          console.log("Calling form.handleSubmit with handler function");
          logger.info("Calling form handleSubmit with handler function");
          form.handleSubmit(handleFormSubmit, onError)(e);
        }}
        className={cn("space-y-4", className)}
      >
        {children}
      </form>
    </Form>
  );
}
