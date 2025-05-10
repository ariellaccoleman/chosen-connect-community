
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ConnectionTypeSelector } from "@/components/profile/organization/ConnectionTypeSelector";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

const formSchema = z.object({
  connection_type: z.enum(["current", "former", "connected_insider"]),
  department: z.string().nullable(),
  notes: z.string().nullable()
});

export type RelationshipFormValues = z.infer<typeof formSchema>;

interface RelationshipFormProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  onSubmit: (values: RelationshipFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const RelationshipForm = ({ 
  relationship,
  onSubmit,
  isSubmitting,
  onCancel
}: RelationshipFormProps) => {
  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connection_type: relationship.connection_type,
      department: relationship.department || "",
      notes: relationship.notes || ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="connection_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Type</FormLabel>
              <FormControl>
                <ConnectionTypeSelector 
                  value={field.value} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your department" 
                  {...field} 
                  value={field.value || ""} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add notes about your connection" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ""} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Brief notes about your relationship with this organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || !form.formState.isDirty}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RelationshipForm;
