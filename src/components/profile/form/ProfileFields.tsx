
import { UseFormReturn } from "react-hook-form";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileFormValues } from "../ProfileForm";

interface ProfileFieldsProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileFields = ({ form }: ProfileFieldsProps) => {
  return (
    <>
      {/* Headline */}
      <FormField
        control={form.control}
        name="headline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Headline</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Senior Developer at Company" {...field} />
            </FormControl>
            <FormDescription>
              A short description of your professional role
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Avatar URL */}
      <FormField
        control={form.control}
        name="avatar_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Avatar URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/avatar.jpg" {...field} />
            </FormControl>
            <FormDescription>
              URL to your profile image
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Bio */}
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell others about yourself..."
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              A brief description about you for your profile
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default ProfileFields;
