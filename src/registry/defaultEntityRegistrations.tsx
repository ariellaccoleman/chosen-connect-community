
import React from 'react';
import { EntityType } from '@/types/entityTypes';
import { EntityRegistration } from '@/types/entityRegistry';
import { 
  Users, Building, Calendar, MessageCircle, 
  FolderKanban, FileText, MessageSquare 
} from 'lucide-react';

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
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/community'
  },
  
  [EntityType.ORGANIZATION]: {
    type: EntityType.ORGANIZATION,
    icon: <Building className="h-4 w-4" />,
    label: 'Organization',
    pluralLabel: 'Organizations',
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/organizations'
  },
  
  [EntityType.EVENT]: {
    type: EntityType.EVENT,
    icon: <Calendar className="h-4 w-4" />,
    label: 'Event',
    pluralLabel: 'Events',
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/events'
  },
  
  [EntityType.GUIDE]: {
    type: EntityType.GUIDE,
    icon: <FileText className="h-4 w-4" />,
    label: 'Guide',
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/guides'
  },
  
  [EntityType.CHAT]: {
    type: EntityType.CHAT,
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'Chat',
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/chat'
  },
  
  [EntityType.HUB]: {
    type: EntityType.HUB,
    icon: <FolderKanban className="h-4 w-4" />,
    label: 'Hub',
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/hubs'
  },
  
  [EntityType.POST]: {
    type: EntityType.POST,
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'Post',
    pluralLabel: 'Posts',
    avatarFallback: (name) => name?.charAt(0) || '?',
    defaultRoute: '/feed'
  }
};

export default defaultRegistrations;
