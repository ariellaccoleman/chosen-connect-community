
import React from "react";
import PostCard from "./PostCard";

// Mock data for demonstration
const MOCK_POSTS = [
  {
    id: "1",
    author: {
      id: "user1",
      name: "Jane Cooper",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      title: "Software Engineer at TechCorp"
    },
    content: "Just launched our new product! Check it out and let me know what you think.",
    timestamp: new Date(Date.now() - 3600000 * 2),
    likes: 24,
    comments: 8,
  },
  {
    id: "2",
    author: {
      id: "user2",
      name: "Alex Morgan",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      title: "Product Manager at Innovate Inc."
    },
    content: "Looking for recommendations on good project management tools for remote teams. Any suggestions?",
    timestamp: new Date(Date.now() - 3600000 * 5),
    likes: 12,
    comments: 15,
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2700&q=80"
  },
  {
    id: "3",
    author: {
      id: "user3",
      name: "David Kim",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      title: "Marketing Director at GrowthCo"
    },
    content: "Just published a new article on effective social media strategies for 2025. Would love your feedback!",
    timestamp: new Date(Date.now() - 3600000 * 24),
    likes: 56,
    comments: 7,
  }
];

const PostList: React.FC = () => {
  return (
    <div className="space-y-4">
      {MOCK_POSTS.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
