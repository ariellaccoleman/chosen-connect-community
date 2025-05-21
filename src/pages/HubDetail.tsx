
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useHub } from '@/hooks/hubs';
import { EntityFeed } from '@/components/entities';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

const HubDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const navigate = useNavigate();
  const { data: hubResponse, isLoading, error } = useHub(hubId);
  const hub = hubResponse?.data;

  // If there's an error or no hub found, redirect to the hubs page
  useEffect(() => {
    if (error || (!isLoading && !hub)) {
      navigate('/hubs');
    }
  }, [hub, isLoading, error, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hub) return null; // Will redirect from the useEffect

  return (
    <>
      <Helmet>
        <title>{hub.name} Hub | CHOSEN Network</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-2">
          <Button variant="ghost" asChild>
            <Link to="/hubs" className="flex items-center text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hubs
            </Link>
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{hub.name} Hub</h1>
          {hub.description && (
            <p className="text-muted-foreground">{hub.description}</p>
          )}
        </div>
        
        <div className="mb-8">
          <EntityFeed
            title="Community Members"
            tagId={hub.tag_id}
            showTabs={true}
            emptyMessage={`No items associated with ${hub.name} yet`}
          />
        </div>
      </div>
    </>
  );
};

export default HubDetail;
