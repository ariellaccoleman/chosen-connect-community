
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
  logger.info("FormWrapper rendering with id:", id);
  
  return (
    <Form {...form}>
      <form 
        id={id}
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className={cn("space-y-4", className)}
      >
        {children}
      </form>
    </Form>
  );
}
