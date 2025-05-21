
import React from 'react';

interface EmptyHubStateProps {
  hubName: string;
}

/**
 * Component to display when a hub has no entities
 */
const EmptyHubState: React.FC<EmptyHubStateProps> = ({ hubName }) => {
  return (
    <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-gray-500">No content associated with {hubName} yet</p>
    </div>
  );
};

export default EmptyHubState;
