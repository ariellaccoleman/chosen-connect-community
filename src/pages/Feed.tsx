
import React from "react";

const Feed: React.FC = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Feed</h1>
      <div className="bg-white dark:bg-sidebar p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Feed content will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default Feed;
