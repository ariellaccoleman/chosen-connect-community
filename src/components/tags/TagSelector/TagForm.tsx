
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormActions from "@/components/common/form/FormActions";

export const tagFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  initialValues?: Partial<TagFormValues>;
  onSubmit: (values: TagFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  isAdmin?: boolean;
}

const TagForm = ({
  initialValues = {
    name: "",
    description: "",
  },
  onSubmit,
  isSubmitting,
  onCancel,
  isAdmin = false,
}: TagFormProps) => {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: initialValues,
  });

  const handleSubmit = async (values: TagFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormActions
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          submitLabel={isSubmitting ? "Creating..." : "Create Tag"}
          align="end"
        />
      </form>
    </Form>
  );
};

export default TagForm;
