
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TAG_TYPES } from "@/utils/tagUtils";

// Schema moved from parent component
const tagSchema = z.object({
  name: z.string().min(2, {
    message: "Tag name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  type: z.enum([TAG_TYPES.PERSON, TAG_TYPES.ORGANIZATION]),
});

export type TagFormValues = z.infer<typeof tagSchema>;

interface TagFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TagFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const TagForm = ({ isOpen, onClose, onSubmit, isSubmitting }: TagFormProps) => {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
      type: TAG_TYPES.PERSON,
    },
  });

  const handleSubmit = async (values: TagFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to the database.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select {...field} className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value={TAG_TYPES.PERSON}>Person</option>
                      <option value={TAG_TYPES.ORGANIZATION}>Organization</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </DialogContent>
          <div className="px-6 py-4 flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </Form>
    </Dialog>
  );
};

export default TagForm;
