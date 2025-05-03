
import { UseFormReturn } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileFormValues } from "./ProfileForm";

interface ProfileSocialLinksProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileSocialLinks = ({ form }: ProfileSocialLinksProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="linkedin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="twitter_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter URL</FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/yourusername" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileSocialLinks;
