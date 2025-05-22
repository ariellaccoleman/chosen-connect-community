
import { EntityRepository } from '../EntityRepository';
import { Profile } from '@/types/profile';
import { EntityType } from '@/types/entityTypes';
import { RepositoryResponse } from '../DataRepository';
import { BaseRepository } from '../BaseRepository';

/**
 * Repository for managing Profile entities
 */
export class ProfileRepository extends EntityRepository<Profile> {
  /**
   * Create a new ProfileRepository
   * 
   * @param tableName The table name
   * @param entityType The entity type
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<any>) {
    super(tableName, entityType, baseRepository);
  }

  /**
   * Convert database record to Profile entity
   */
  convertToEntity(record: any): Profile {
    return {
      id: record.id,
      entityType: EntityType.PERSON, // Add entityType to satisfy Entity interface
      name: `${record.first_name} ${record.last_name}`, // Add name to satisfy Entity interface
      firstName: record.first_name,
      lastName: record.last_name,
      email: record.email,
      bio: record.bio || '',
      headline: record.headline || '',
      avatarUrl: record.avatar_url || '',
      company: record.company || '',
      websiteUrl: record.website_url || '',
      twitterUrl: record.twitter_url || '',
      linkedinUrl: record.linkedin_url || '',
      timezone: record.timezone || 'UTC',
      isApproved: record.is_approved || false,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  /**
   * Convert Profile entity to database record
   */
  convertFromEntity(entity: Partial<Profile>): Record<string, any> {
    const record: Record<string, any> = {};
    
    if (entity.id !== undefined) record.id = entity.id;
    if (entity.firstName !== undefined) record.first_name = entity.firstName;
    if (entity.lastName !== undefined) record.last_name = entity.lastName;
    if (entity.email !== undefined) record.email = entity.email;
    if (entity.bio !== undefined) record.bio = entity.bio;
    if (entity.headline !== undefined) record.headline = entity.headline;
    if (entity.avatarUrl !== undefined) record.avatar_url = entity.avatarUrl;
    if (entity.company !== undefined) record.company = entity.company;
    if (entity.websiteUrl !== undefined) record.website_url = entity.websiteUrl;
    if (entity.twitterUrl !== undefined) record.twitter_url = entity.twitterUrl;
    if (entity.linkedinUrl !== undefined) record.linkedin_url = entity.linkedinUrl;
    if (entity.timezone !== undefined) record.timezone = entity.timezone;
    if (entity.isApproved !== undefined) record.is_approved = entity.isApproved;
    
    return record;
  }

  /**
   * Find profiles by email
   * @param email Email to search for
   */
  async findByEmail(email: string): Promise<RepositoryResponse<Profile | null>> {
    try {
      const result = await this.baseRepository.select()
        .eq('email', email)
        .maybeSingle();
      
      if (result.isSuccess() && result.data) {
        return {
          data: this.convertToEntity(result.data),
          error: null,
          isSuccess: () => true,
          isError: () => false,
          getErrorMessage: () => null
        };
      }
      
      return result as unknown as RepositoryResponse<Profile | null>;
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
}
