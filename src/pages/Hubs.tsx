
import React from 'react';
import { Helmet } from 'react-helmet'; 
import HubGrid from '@/components/hubs/HubGrid';

const Hubs: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Hubs | CHOSEN Network</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hubs</h1>
          <p className="text-muted-foreground">
            Discover communities and resources organized by topics
          </p>
        </div>
        
        <HubGrid />
      </div>
    </>
  );
};

export default Hubs;
