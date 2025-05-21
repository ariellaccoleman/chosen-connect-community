
import React from "react";
import PostCard from "./PostCard";

interface PostListProps {
  selectedTagId: string | null;
}

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
    tags: [
      { id: "tag1", name: "Product Launch", color: "blue" },
      { id: "tag2", name: "Tech", color: "green" }
    ]
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
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2700&q=80",
    tags: [
      { id: "tag3", name: "Remote Work", color: "purple" },
      { id: "tag4", name: "Project Management", color: "orange" }
    ]
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
    tags: [
      { id: "tag5", name: "Marketing", color: "red" },
      { id: "tag6", name: "Social Media", color: "pink" }
    ]
  }
];

const PostList: React.FC<PostListProps> = ({ selectedTagId }) => {
  // Filter posts by selected tag
  const filteredPosts = selectedTagId
    ? MOCK_POSTS.filter(post => post.tags.some(tag => tag.id === selectedTagId))
    : MOCK_POSTS;

  if (filteredPosts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No posts match the selected tag.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
