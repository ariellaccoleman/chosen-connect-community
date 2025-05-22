
import { EntityRepository } from '../EntityRepository';
import { Profile } from '@/types/profile';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { RepositoryResponse } from '../DataRepository';
import { createSuccessResponse, createErrorResponse } from '../repositoryUtils';

/**
 * ProfileRepository class for specialized profile operations
 */
export class ProfileRepository extends EntityRepository<Profile> {
  constructor() {
    super('profiles', EntityType.PERSON);
  }

  /**
   * Convert database record to Profile entity
   */
  convertToEntity(record: any): Profile {
    return {
      id: record.id,
      entityType: EntityType.PERSON,
      name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
      firstName: record.first_name || '',
      lastName: record.last_name || '',
      email: record.email || '',
      bio: record.bio || '',
      headline: record.headline || '',
      avatarUrl: record.avatar_url || '',
      company: record.company || '',
      websiteUrl: record.website_url || '',
      twitterUrl: record.twitter_url || '',
      linkedinUrl: record.linkedin_url || '',
      timezone: record.timezone || 'UTC',
      isApproved: record.is_approved ?? true,
      membershipTier: record.membership_tier || 'free',
      locationId: record.location_id || null,
      createdAt: record.created_at ? new Date(record.created_at) : new Date(),
      updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
    };
  }

  /**
   * Convert Profile entity to database record
   */
  convertFromEntity(entity: Profile): Record<string, any> {
    return {
      id: entity.id,
      first_name: entity.firstName,
      last_name: entity.lastName,
      email: entity.email,
      bio: entity.bio,
      headline: entity.headline,
      avatar_url: entity.avatarUrl,
      company: entity.company,
      website_url: entity.websiteUrl,
      twitter_url: entity.twitterUrl,
      linkedin_url: entity.linkedinUrl,
      timezone: entity.timezone,
      is_approved: entity.isApproved,
      membership_tier: entity.membershipTier,
      location_id: entity.locationId,
    };
  }

  /**
   * Find profiles by email address
   */
  async findByEmail(email: string): Promise<Profile | null> {
    try {
      const result = await this.select()
        .eq('email', email)
        .maybeSingle();

      if (result.isSuccess() && result.data) {
        return this.convertToEntity(result.data);
      }

      return null;
    } catch (error) {
      this.handleError('findByEmail', error, { email });
      return null;
    }
  }

  /**
   * Search profiles by name (first name or last name)
   */
  async searchByName(query: string): Promise<Profile[]> {
    try {
      const result = await this.select()
        .ilike('first_name', `%${query}%`)
        .execute();

      const resultLastName = await this.select()
        .ilike('last_name', `%${query}%`)
        .execute();

      const combinedResults: any[] = [];
      
      // Combine and deduplicate results
      if (result.isSuccess() && result.data) {
        combinedResults.push(...result.data);
      }
      
      if (resultLastName.isSuccess() && resultLastName.data) {
        for (const profile of resultLastName.data) {
          if (!combinedResults.some(r => r.id === profile.id)) {
            combinedResults.push(profile);
          }
        }
      }

      // Convert to entities
      return combinedResults.map(record => this.convertToEntity(record));
    } catch (error) {
      this.handleError('searchByName', error, { query });
      return [];
    }
  }

  /**
   * Find approved profiles only
   */
  async findApproved(): Promise<Profile[]> {
    try {
      const result = await this.select()
        .eq('is_approved', true)
        .execute();

      if (result.isSuccess() && result.data) {
        return result.data.map(record => this.convertToEntity(record));
      }

      return [];
    } catch (error) {
      this.handleError('findApproved', error);
      return [];
    }
  }
}

