
import React from "react";
import Layout from "@/components/layout/Layout";
import PostComposer from "@/components/feed/PostComposer";
import PostList from "@/components/feed/PostList";
import { Card } from "@/components/ui/card";

const Feed: React.FC = () => {
  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Feed</h1>
        
        {/* Post composer */}
        <div className="mb-6">
          <PostComposer />
        </div>
        
        {/* Feed content */}
        <div className="space-y-4">
          <PostList />
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
