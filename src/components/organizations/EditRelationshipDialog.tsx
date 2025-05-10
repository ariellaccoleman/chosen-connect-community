
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateOrganizationRelationship, useDeleteOrganizationRelationship } from "@/hooks/useOrganizationMutations";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { Trash2 } from "lucide-react";

const formSchema = z.object({
  connection_type: z.enum(["current", "former", "connected_insider"]),
  department: z.string().nullable(),
  notes: z.string().nullable()
});

type FormValues = z.infer<typeof formSchema>;

interface EditRelationshipDialogProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

const EditRelationshipDialog = ({ relationship, isOpen, onClose }: EditRelationshipDialogProps) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const updateRelationship = useUpdateOrganizationRelationship();
  const deleteRelationship = useDeleteOrganizationRelationship();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connection_type: relationship.connection_type === 'ally' ? 'connected_insider' : relationship.connection_type,
      department: relationship.department || "",
      notes: relationship.notes || ""
    }
  });

  const handleSubmit = async (values: FormValues) => {
    await updateRelationship.mutateAsync({
      relationshipId: relationship.id,
      relationshipData: {
        connection_type: values.connection_type,
        department: values.department || null,
        notes: values.notes || null
      }
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteRelationship.mutateAsync(relationship.id);
    setIsDeleteAlertOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Organization Connection</DialogTitle>
            <DialogDescription>
              Update your relationship with {relationship.organization?.name}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="connection_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={updateRelationship.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select connection type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="current">Current Organization</SelectItem>
                        <SelectItem value="former">Former Organization</SelectItem>
                        <SelectItem value="connected_insider">Connected Insider</SelectItem>
                      </SelectContent>
                    </Select>
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
                        disabled={updateRelationship.isPending}
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
                        disabled={updateRelationship.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief notes about your relationship with this organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between sm:justify-between">
                <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Connection
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove your connection to {relationship.organization?.name}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteRelationship.isPending}
                      >
                        {deleteRelationship.isPending ? "Removing..." : "Yes, remove it"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={updateRelationship.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateRelationship.isPending || !form.formState.isDirty}
                  >
                    {updateRelationship.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditRelationshipDialog;
