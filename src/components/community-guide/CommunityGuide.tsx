
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuideHeader } from '@/components/community-guide/GuideHeader';
import { GettingStartedTab } from '@/components/community-guide/GettingStartedTab';
import { CommunityEngagementTab } from '@/components/community-guide/CommunityEngagementTab';
import { SuccessStrategiesTab } from '@/components/community-guide/SuccessStrategiesTab';

const CommunityGuide = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <GuideHeader />

          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="engagement">Community Engagement</TabsTrigger>
              <TabsTrigger value="success">Success Stories</TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-6">
              <GettingStartedTab />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <CommunityEngagementTab />
            </TabsContent>

            <TabsContent value="success" className="space-y-6">
              <SuccessStrategiesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityGuide;
