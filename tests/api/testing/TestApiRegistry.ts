
/**
 * Dynamic API registry for testing
 * Replaces hard-coded API lists with extensible registry pattern
 */

import { resetPostsApi } from '@/api/posts/postsApiFactory';
import { resetChatMessageApi } from '@/api/chat/chatMessageApiFactory';
import { resetOrganizationApi } from '@/api/organizations/organizationApiFactory';
import { resetProfileApi } from '@/api/profiles/profileApiFactory';
import { createEvent } from '@/api/events/eventApiFactory';
import { tagApi } from '@/api/tags/factory/tagApiFactory';
import { logger } from '@/utils/logger';

export type ApiResetFunction = (client?: any) => any;
export type ApiFactoryFunction = any;

export interface ApiRegistryEntry {
  resetFunction?: ApiResetFunction;
  factoryFunction?: ApiFactoryFunction;
  description: string;
}

/**
 * Registry of available APIs for testing
 */
class TestApiRegistry {
  private registry = new Map<string, ApiRegistryEntry>();

  /**
   * Register an API for testing
   */
  register(name: string, entry: ApiRegistryEntry): void {
    this.registry.set(name, entry);
    logger.debug(`Registered API for testing: ${name}`);
  }

  /**
   * Get all registered API names
   */
  getRegisteredApis(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get API entry by name
   */
  getApi(name: string): ApiRegistryEntry | undefined {
    return this.registry.get(name);
  }

  /**
   * Reset specific API with authenticated client
   */
  resetApi(name: string, client?: any): any {
    const entry = this.registry.get(name);
    if (!entry?.resetFunction) {
      throw new Error(`No reset function available for API: ${name}`);
    }
    
    logger.info(`Resetting API: ${name}`);
    return entry.resetFunction(client);
  }

  /**
   * Get all reset APIs with authenticated client
   */
  getAllResetApis(client?: any): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name, entry] of this.registry.entries()) {
      if (entry.resetFunction) {
        result[name] = entry.resetFunction(client);
      }
    }
    
    return result;
  }

  /**
   * Get factory function for API
   */
  getFactoryFunction(name: string): any {
    const entry = this.registry.get(name);
    return entry?.factoryFunction;
  }
}

// Create singleton instance
export const testApiRegistry = new TestApiRegistry();

// Register core APIs
testApiRegistry.register('posts', {
  resetFunction: resetPostsApi,
  description: 'Posts and related APIs'
});

testApiRegistry.register('chat', {
  resetFunction: resetChatMessageApi,
  description: 'Chat message APIs'
});

testApiRegistry.register('organization', {
  resetFunction: resetOrganizationApi,
  description: 'Organization APIs'
});

testApiRegistry.register('profile', {
  resetFunction: resetProfileApi,
  description: 'Profile APIs'
});

testApiRegistry.register('events', {
  factoryFunction: { createEvent },
  description: 'Event APIs'
});

testApiRegistry.register('tags', {
  factoryFunction: tagApi,
  description: 'Tag APIs'
});

export default testApiRegistry;
