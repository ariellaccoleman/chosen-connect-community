
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';

export const GettingStartedTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to CHOSEN</CardTitle>
        <CardDescription>Your journey starts here</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Our Community Values</h3>
          <p>
            CHOSEN is a community platform for professionals who love Israel to build and protect
            our community, businesses, and careers through meaningful relationships. Every member has
            a critical role to play, and everyone's contribution is valued.
          </p>
          <p>
            Our success depends on community engagement. This is a place for members to show up
            and be active participants in a trusted and trustworthy community based on shared values.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">First Steps</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Complete your profile</strong>
                <p className="text-muted-foreground">Add your photo, professional background, and skills to help others connect with you.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Browse the Members Map</strong>
                <p className="text-muted-foreground">Discover community members around the world and make connections.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Join a Group</strong>
                <p className="text-muted-foreground">Find groups aligned with your interests or professional focus.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Explore Resources</strong>
                <p className="text-muted-foreground">Visit our Resources section to find helpful organizations and services.</p>
              </div>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
