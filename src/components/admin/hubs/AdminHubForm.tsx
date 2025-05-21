
import React from 'react';
import { useCreateHub } from '@/hooks/hubs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import TagSelector from '@/components/tags/TagSelector'; // Fixed import
import { HubFormValues } from '@/types/hub';

interface AdminHubFormProps {
  initialValues?: HubFormValues;
  onSuccess: () => void;
  onCancel: () => void;
}

const hubFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  tag_id: z.string().optional(),
  is_featured: z.boolean().optional().default(false)
});

const AdminHubForm: React.FC<AdminHubFormProps> = ({
  initialValues,
  onSuccess,
  onCancel
}) => {
  const { mutate: createHub, isPending } = useCreateHub();
  
  const form = useForm<z.infer<typeof hubFormSchema>>({
    resolver: zodResolver(hubFormSchema),
    defaultValues: initialValues || {
      name: '',
      description: '',
      tag_id: undefined,
      is_featured: false
    }
  });
  
  const onSubmit = (values: z.infer<typeof hubFormSchema>) => {
    createHub(values, {
      onSuccess: () => {
        onSuccess();
        form.reset();
      }
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hub Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter hub name" {...field} />
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
                <Textarea 
                  placeholder="Enter hub description" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tag_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Tag</FormLabel>
              <FormControl>
                <TagSelector 
                  value={field.value || ''} 
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Featured Hub</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Featured hubs will be displayed on the homepage
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Hub'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AdminHubForm;
