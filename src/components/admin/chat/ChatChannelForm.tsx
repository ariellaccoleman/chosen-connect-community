
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormWrapper } from '@/components/common/form/FormWrapper';
import { Textarea } from '@/components/ui/textarea';
import { ChatChannelCreate, ChatChannelType } from '@/types/chat';
import EntityTagManager from '@/components/tags/EntityTagManager';
import { EntityType } from '@/types/entityTypes';

const channelFormSchema = z.object({
  name: z.string().min(3, 'Channel name must be at least 3 characters'),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
  channel_type: z.enum(['group', 'dm', 'announcement']).default('group'),
});

type ChatChannelFormValues = z.infer<typeof channelFormSchema>;

interface ChatChannelFormProps {
  onSubmit: (data: ChatChannelCreate) => void; 
  isSubmitting?: boolean;
  defaultValues?: Partial<ChatChannelFormValues>;
  isEditMode?: boolean;
  existingChannelId?: string;
}

export default function ChatChannelForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  isEditMode = false,
  existingChannelId
}: ChatChannelFormProps) {
  const form = useForm<ChatChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      is_public: defaultValues?.is_public === false ? false : true,
      channel_type: defaultValues?.channel_type || 'group'
    },
  });
  
  const handleSubmitForm = (values: ChatChannelFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description,
      is_public: values.is_public,
      channel_type: values.channel_type as ChatChannelType
    });
  };
  
  return (
    <FormWrapper form={form} onSubmit={handleSubmitForm}>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Channel Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter channel name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="description"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Enter channel description" 
                rows={3} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="channel_type"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Channel Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="dm">Direct Message</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="is_public"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0">
            <FormLabel>Public Channel</FormLabel>
            <FormControl>
              <Switch 
                checked={field.value} 
                onCheckedChange={field.onChange} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {existingChannelId && (
        <div className="space-y-2">
          <FormLabel>Channel Tags</FormLabel>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
            <EntityTagManager
              entityId={existingChannelId}
              entityType={EntityType.CHAT}
              isAdmin={true}
              isEditing={true}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isEditMode ? 'Update Channel' : 'Create Channel'}
        </Button>
      </div>
    </FormWrapper>
  );
}
