
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, CreateEventFormValues } from "./schema/eventSchema";
import { FormWrapper } from "@/components/common/form/FormWrapper";
import FormInput from "@/components/common/form/FormInput";
import FormTextarea from "@/components/common/form/FormTextarea";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useEventMutations } from "@/hooks/useEventMutations";
import FormActions from "@/components/common/form/FormActions";
import LocationSelector from "@/components/profile/form/LocationSelector";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EventFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createEventMutation } = useEventMutations();
  const [locationFieldVisible, setLocationFieldVisible] = useState(false);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      is_virtual: true,
      location_id: null,
      tag_id: null,
      is_paid: false,
      price: null,
    },
  });

  const isVirtual = form.watch("is_virtual");
  const isPaid = form.watch("is_paid");
  const isSubmitting = createEventMutation.isPending;

  const handleSubmit = async (values: CreateEventFormValues) => {
    if (!user?.id) return;

    // If event is not paid, ensure price is null
    if (!values.is_paid) {
      values.price = null;
    }

    // If event is virtual, ensure location_id is null
    if (values.is_virtual) {
      values.location_id = null;
    }

    await createEventMutation.mutateAsync({
      event: values,
      hostId: user.id,
    });

    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/events");
    }
  };

  return (
    <FormWrapper form={form} onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Create New Event</h2>
      
      <FormInput
        name="title"
        control={form.control}
        label="Event Title"
        placeholder="Enter event title"
        required
      />
      
      <FormTextarea
        name="description"
        control={form.control}
        label="Event Description"
        placeholder="Describe your event..."
        rows={5}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name="start_time"
          control={form.control}
          label="Start Time"
          type="datetime-local"
          required
        />
        
        <FormInput
          name="end_time"
          control={form.control}
          label="End Time"
          type="datetime-local"
          required
        />
      </div>
      
      <FormField
        control={form.control}
        name="is_virtual"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Event Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value === "virtual");
                  setLocationFieldVisible(value === "in-person");
                }}
                defaultValue={field.value ? "virtual" : "in-person"}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="virtual" id="virtual" />
                  <label htmlFor="virtual" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Virtual Event
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-person" id="in-person" />
                  <label htmlFor="in-person" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    In-Person Event
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />
      
      {!isVirtual && (
        <LocationSelector
          control={form.control}
          label="Event Location"
          required={!isVirtual}
          fieldName="location_id"
        />
      )}
      
      <FormField
        control={form.control}
        name="is_paid"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Paid Event</FormLabel>
              <p className="text-sm text-muted-foreground">
                Toggle this if your event requires payment
              </p>
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
      
      {isPaid && (
        <FormInput
          name="price"
          control={form.control}
          label="Price"
          type="number"
          placeholder="0.00"
          required={isPaid}
        />
      )}
      
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Create Event"
      />
    </FormWrapper>
  );
};

export default EventForm;
