
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
   * The base repository to delegate database operations to
   */
  protected baseRepository: BaseRepository<Profile>;

  /**
   * Create a new ProfileRepository
   * 
   * @param tableName The table name
   * @param baseRepository The base repository to delegate to
   */
  constructor(tableName: string, entityType: EntityType, baseRepository: BaseRepository<Profile>) {
    super(tableName, entityType);
    this.baseRepository = baseRepository;
  }

  /**
   * Delegate select operation to base repository
   */
  select(columns?: string): BaseRepository<Profile> {
    return this.baseRepository.select(columns);
  }

  /**
   * Delegate insert operation to base repository
   */
  insert(values: Partial<Profile> | Partial<Profile>[]): BaseRepository<Profile> {
    return this.baseRepository.insert(values);
  }

  /**
   * Delegate update operation to base repository
   */
  update(values: Partial<Profile>): BaseRepository<Profile> {
    return this.baseRepository.update(values);
  }

  /**
   * Delegate delete operation to base repository
   */
  delete(): BaseRepository<Profile> {
    return this.baseRepository.delete();
  }

  /**
   * Convert database record to Profile entity
   */
  convertToEntity(record: any): Profile {
    return {
      id: record.id,
      entityType: EntityType.PERSON,
      name: `${record.first_name} ${record.last_name}`,
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
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
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
      
      return result as RepositoryResponse<Profile | null>;
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
