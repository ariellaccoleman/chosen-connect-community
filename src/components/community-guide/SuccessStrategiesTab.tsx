
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const SuccessStrategiesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Stories & Strategies</CardTitle>
        <CardDescription>Learn from community success stories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Success Stories</h3>
          <p>
            Our community members have achieved remarkable success by leveraging connections,
            resources, and opportunities available through CHOSEN. Here are some inspiring stories:
          </p>
          
          <div className="space-y-4 mt-4">
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Professional Connections</h4>
              <p className="text-muted-foreground">
                "Through CHOSEN, I connected with professionals in my industry who helped me navigate 
                career challenges during a difficult time. The support was invaluable."
              </p>
              <p className="text-sm mt-2">- Sarah K., Marketing Executive</p>
            </div>
            
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Business Growth</h4>
              <p className="text-muted-foreground">
                "I found business partners and clients through the community directory. My consulting 
                practice has grown 40% since joining the network."
              </p>
              <p className="text-sm mt-2">- David L., Business Consultant</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Strategies for Success</h3>
          <p>
            Based on our community's collective experience, here are key strategies that can help you 
            make the most of your CHOSEN membership:
          </p>
          
          <ul className="space-y-3 mt-4">
            <li className="border p-3 rounded-lg">
              <h4 className="font-medium">Be Proactive in Connecting</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Reach out to others regularly. Don't wait for connections to come to you.
              </p>
            </li>
            <li className="border p-3 rounded-lg">
              <h4 className="font-medium">Share Your Expertise</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Contribute your knowledge and skills. Helping others builds strong relationships.
              </p>
            </li>
            <li className="border p-3 rounded-lg">
              <h4 className="font-medium">Attend Community Events</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Virtual and in-person gatherings are excellent opportunities to deepen connections.
              </p>
            </li>
            <li className="border p-3 rounded-lg">
              <h4 className="font-medium">Stay Engaged Regularly</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Make community engagement a regular part of your professional routine.
              </p>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
