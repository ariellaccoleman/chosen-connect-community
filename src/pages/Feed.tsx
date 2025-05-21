
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntityFeed } from '@/hooks/useEntityFeed';
import { EntityType } from '@/types/entityTypes';
import TagFilter from '@/components/filters/TagFilter';
import PostCreator from '@/components/posts/PostCreator';
import PostList from '@/components/posts/PostList';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Feed = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  
  // Use the entity feed hook to get feed content
  const { 
    entities, 
    isLoading, 
    error, 
    selectedTagId, 
    setSelectedTagId, 
    tags 
  } = useEntityFeed({
    entityTypes: [EntityType.POST],
    limit: 50,
  });

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Feed</h1>
            <p className="text-muted-foreground">
              See what's happening in the community
            </p>
          </div>

          {!user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be logged in to create posts.{' '}
                <Button variant="link" className="p-0" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {user && (
            <Card>
              <CardContent className="pt-6">
                <PostCreator />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Tabs 
                defaultValue="all" 
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All Posts</TabsTrigger>
                  <TabsTrigger value="following" disabled>Following</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="w-full sm:w-64">
                <TagFilter
                  selectedTagId={selectedTagId || ''}
                  onSelectTag={setSelectedTagId}
                  tags={tags}
                />
              </div>
            </div>

            <Separator />

            <PostList 
              entities={entities} 
              isLoading={isLoading} 
              error={error}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
