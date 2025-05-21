
import React from 'react';
import { EntityType } from '@/types/entityTypes';
import { Users, Building, Calendar, MessageCircle, 
  FolderKanban, FileText, MessageSquare } from 'lucide-react';

/**
 * Default entity registrations for core entity types.
 * This provides configuration for each entity type across the app.
 */
const defaultRegistrations = {
  [EntityType.PERSON]: {
    type: EntityType.PERSON,
    icon: <Users className="h-4 w-4" />,
    label: 'Person',
    pluralLabel: 'People',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/community'
  },
  
  [EntityType.ORGANIZATION]: {
    type: EntityType.ORGANIZATION,
    icon: <Building className="h-4 w-4" />,
    label: 'Organization',
    pluralLabel: 'Organizations',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/organizations'
  },
  
  [EntityType.EVENT]: {
    type: EntityType.EVENT,
    icon: <Calendar className="h-4 w-4" />,
    label: 'Event',
    pluralLabel: 'Events',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/events'
  },
  
  [EntityType.GUIDE]: {
    type: EntityType.GUIDE,
    icon: <FileText className="h-4 w-4" />,
    label: 'Guide',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/guides'
  },
  
  [EntityType.CHAT]: {
    type: EntityType.CHAT,
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'Chat',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/chat'
  },
  
  [EntityType.HUB]: {
    type: EntityType.HUB,
    icon: <FolderKanban className="h-4 w-4" />,
    label: 'Hub',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/hubs'
  },
  
  [EntityType.POST]: {
    type: EntityType.POST,
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'Post',
    pluralLabel: 'Posts',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/feed'
  }
};

// Export the default registrations
export default defaultRegistrations;

// Export the function to initialize the registry with default registrations
export const initializeDefaultEntityRegistrations = () => {
  // This would normally initialize the registry, but is now handled differently
  // The import and usage is preserved for compatibility
}
