
import { UseFormReturn } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription 
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
        <CardTitle>Social Media & Website</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Website</FormLabel>
              <FormControl>
                <Input placeholder="yourwebsite.com" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                You can enter just "yourwebsite.com" without "https://"
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linkedin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input placeholder="linkedin.com/in/yourprofile" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                You can enter just "linkedin.com/in/yourprofile" without "https://"
              </FormDescription>
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
                <Input placeholder="twitter.com/yourusername" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                You can enter just "twitter.com/yourusername" without "https://"
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileSocialLinks;
