
import { EntityRepository } from '../EntityRepository';
import { Profile, ProfileWithDetails } from '@/types/profile';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';
import { Location } from '@/types/location';
import { createSuccessResponse } from '../repositoryUtils';
import { logger } from '@/utils/logger';

/**
 * Repository for managing Profile entities
 */
export class ProfileRepository extends EntityRepository<ProfileWithDetails> {
  /**
   * Creates a new ProfileRepository
   * @param baseRepository The base repository to use for database operations
   */
  constructor(baseRepository: BaseRepository<ProfileWithDetails>) {
    super('profiles', EntityType.PERSON, baseRepository);
  }

  /**
   * Convert database record to Profile entity
   */
  convertToEntity(record: any): ProfileWithDetails {
    // Convert timestamps to standard format
    const createdAt = record.created_at ? new Date(record.created_at).toISOString() : undefined;
    const updatedAt = record.updated_at ? new Date(record.updated_at).toISOString() : undefined;
    
    const firstName = record.first_name || '';
    const lastName = record.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return {
      id: record.id,
      entityType: EntityType.PERSON,
      name: fullName,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      email: record.email || '',
      bio: record.bio || '',
      headline: record.headline || '',
      avatar_url: record.avatar_url || '',
      company: record.company || '',
      website_url: record.website_url || '',
      twitter_url: record.twitter_url || '',
      linkedin_url: record.linkedin_url || '',
      location_id: record.location_id || null,
      is_approved: record.is_approved || false,
      membership_tier: record.membership_tier || 'free',
      created_at: createdAt,
      updated_at: updatedAt,
      
      // Include location if available
      location: record.location ? this.convertLocationToEntity(record.location) : undefined,
      
      // Include tags if available
      tags: record.tags || [],
    };
  }

  /**
   * Convert Profile entity to database record
   */
  convertFromEntity(entity: ProfileWithDetails): Record<string, any> {
    return {
      id: entity.id,
      first_name: entity.first_name,
      last_name: entity.last_name,
      email: entity.email,
      bio: entity.bio,
      headline: entity.headline,
      avatar_url: entity.avatar_url,
      company: entity.company,
      website_url: entity.website_url,
      twitter_url: entity.twitter_url,
      linkedin_url: entity.linkedin_url,
      location_id: entity.location_id,
      is_approved: entity.is_approved,
      membership_tier: entity.membership_tier,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  /**
   * Convert location record to Location entity
   */
  private convertLocationToEntity(record: any): Location | undefined {
    if (!record) return undefined;
    
    return {
      id: record.id,
      city: record.city || '',
      region: record.region || '',
      country: record.country || '',
      formatted_location: record.formatted_location || `${record.city || ''}, ${record.region || ''}, ${record.country || ''}`.replace(/^, /, '').replace(/, $/, ''),
      latitude: record.latitude,
      longitude: record.longitude,
      timezone: record.timezone || 'UTC',
    };
  }

  /**
   * Find profiles by email
   * @param email Email to search for
   */
  async findByEmail(email: string): Promise<RepositoryResponse<ProfileWithDetails | null>> {
    try {
      const result = await this.baseRepository.select()
        .eq('email', email)
        .maybeSingle();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(this.convertToEntity(result.data));
      }
      
      return result as RepositoryResponse<ProfileWithDetails | null>;
    } catch (error) {
      this.handleError('findByEmail', error, { email });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to find profile by email: ${email}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to find profile by email: ${email}`
      };
    }
  }

  /**
   * Search profiles by name
   * @param query Search query
   */
  async searchByName(query: string): Promise<RepositoryResponse<ProfileWithDetails[]>> {
    try {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return createSuccessResponse([]);
      }
      
      // Search by first name or last name
      const result = await this.baseRepository.select()
        .or(`first_name.ilike.%${normalizedQuery}%,last_name.ilike.%${normalizedQuery}%`)
        .execute();
      
      if (result.isSuccess() && result.data) {
        return createSuccessResponse(
          result.data.map(record => this.convertToEntity(record))
        );
      }
      
      return result as RepositoryResponse<ProfileWithDetails[]>;
    } catch (error) {
      this.handleError('searchByName', error, { query });
      return {
        data: null,
        error: {
          code: 'query_error',
          message: `Failed to search profiles by name: ${query}`,
          original: error
        },
        isSuccess: () => false,
        isError: () => true,
        getErrorMessage: () => `Failed to search profiles by name: ${query}`
      };
    }
  }
}

/**
 * Create a profile repository instance
 * @param baseRepository Base repository to use for database operations
 * @returns Profile repository instance
 */
export function createProfileRepository(
  baseRepository: BaseRepository<ProfileWithDetails>
): ProfileRepository {
  try {
    return new ProfileRepository(baseRepository);
  } catch (error) {
    logger.error('Failed to create profile repository', error);
    throw error;
  }
}
