
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { HubWithDetails } from '@/types';
import { useNavigate } from 'react-router-dom';

interface HubHeaderProps {
  hub: HubWithDetails;
}

/**
 * Header component for the hub detail page
 */
const HubHeader: React.FC<HubHeaderProps> = ({ hub }) => {
  const navigate = useNavigate();

  // Update to use browser history instead of hardcoded route
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" onClick={handleBack} className="flex items-center text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{hub?.name} Hub</h1>
        {hub?.description && (
          <p className="text-muted-foreground">{hub.description}</p>
        )}
      </div>
    </>
  );
};

export default HubHeader;
