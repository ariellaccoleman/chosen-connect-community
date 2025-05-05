
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, Heart, Users, MessageCircle, Calendar } from 'lucide-react';

export const CommunityEngagementTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Engagement</CardTitle>
        <CardDescription>Ways to be an active community member</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Support Others</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Respond to posts in the community feed. Offer advice, resources, or encouragement to fellow members.
            </p>
          </div>
          
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Make Connections</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Reach out to members with similar interests. Use the messaging system to introduce yourself and build relationships.
            </p>
          </div>
          
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-violet-500" />
              <h3 className="font-semibold">Share Your Expertise</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Post valuable content to the community feed. Share insights from your field that others might benefit from.
            </p>
          </div>
          
          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold">Attend Events</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Join virtual and in-person events. Events are great opportunities to meet other members and build your network.
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Community Guidelines</h3>
          <ul className="space-y-3">
            {['Be respectful and constructive', 'Maintain confidentiality', 'Contribute meaningfully', 'Support Israel and each other'].map((guideline, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>{guideline}</strong>
                  <p className="text-muted-foreground">
                    {index === 0 && 'Approach all interactions with respect, even when opinions differ.'}
                    {index === 1 && 'Keep sensitive information within the community.'}
                    {index === 2 && 'Focus on quality over quantity in your interactions.'}
                    {index === 3 && 'Remember our shared values and purpose as a community.'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
