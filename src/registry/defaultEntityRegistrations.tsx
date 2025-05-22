import React from 'react';
import { EntityType } from '@/types/entityTypes';
import { Users, Building, Calendar, MessageCircle, 
  FolderKanban, FileText, MessageSquare, Briefcase } from 'lucide-react';

/**
 * Interface for entity registration details
 */
export interface EntityRegistration {
  type: EntityType;
  icon: React.ReactNode;
  label: string;
  pluralLabel?: string;
  avatarFallback: (name: string) => string;
  defaultRoute: string;
}

/**
 * Default entity registrations for core entity types.
 * This provides configuration for each entity type across the app.
 */
const defaultRegistrations: Record<EntityType, EntityRegistration> = {
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
    pluralLabel: 'Guides',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/guides'
  },
  
  [EntityType.CHAT]: {
    type: EntityType.CHAT,
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'Chat',
    pluralLabel: 'Chats',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/chat'
  },
  
  [EntityType.HUB]: {
    type: EntityType.HUB,
    icon: <FolderKanban className="h-4 w-4" />,
    label: 'Hub',
    pluralLabel: 'Hubs',
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
  },
  
  [EntityType.JOB]: {
    type: EntityType.JOB,
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Job',
    pluralLabel: 'Jobs',
    avatarFallback: (name: string) => name?.charAt(0) || '?',
    defaultRoute: '/jobs'
  }
};

// Export the default registrations
export default defaultRegistrations;
