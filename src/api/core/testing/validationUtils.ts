
import { DataRepository } from '../repository/DataRepository';
import { logger } from '@/utils/logger';

/**
 * ValidatorFunction type for field validation
 */
export type ValidatorFunction<T> = (
  item: T,
  field: keyof T,
  repository: DataRepository<T>
) => boolean | Promise<boolean>;

/**
 * RepositoryValidationError class for handling validation errors
 */
export class RepositoryValidationError extends Error {
  public readonly field: string;
  public readonly value: any;
  
  constructor(message: string, field: string, value: any) {
    super(message);
    this.name = 'RepositoryValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * RepositoryValidator class for validating entity data
 */
export class RepositoryValidator<T> {
  private validators: Map<keyof T, ValidatorFunction<T>[]>;
  private repository: DataRepository<T>;
  
  constructor(repository: DataRepository<T>) {
    this.validators = new Map();
    this.repository = repository;
  }
  
  /**
   * Add a validator for a specific field
   */
  addValidator(field: keyof T, validator: ValidatorFunction<T>): this {
    if (!this.validators.has(field)) {
      this.validators.set(field, []);
    }
    
    this.validators.get(field)!.push(validator);
    return this;
  }
  
  /**
   * Validate a specific field of an entity
   */
  async validateField(item: T, field: keyof T): Promise<boolean> {
    const fieldValidators = this.validators.get(field);
    
    if (!fieldValidators || fieldValidators.length === 0) {
      // No validators for this field, consider it valid
      return true;
    }
    
    for (const validator of fieldValidators) {
      const isValid = await validator(item, field, this.repository);
      
      if (!isValid) {
        throw new RepositoryValidationError(
          `Validation failed for field: ${String(field)}`,
          String(field),
          item[field]
        );
      }
    }
    
    return true;
  }
  
  /**
   * Validate all configured fields of an entity
   */
  async validate(item: T): Promise<boolean> {
    for (const field of this.validators.keys()) {
      await this.validateField(item, field);
    }
    
    return true;
  }
  
  /**
   * Pre-built validator for checking if a field is unique
   */
  static uniqueValidator<T>(field: keyof T): ValidatorFunction<T> {
    return async (item: T, _: keyof T, repository: DataRepository<T>) => {
      const result = await repository
        .select()
        .eq(field as string, item[field])
        .execute();
      
      if (result.isError()) {
        throw new Error(`Error checking uniqueness: ${result.getErrorMessage()}`);
      }
      
      // If we found no items or just the current item, it's unique
      return result.data!.length === 0 || 
        (result.data!.length === 1 && 
         (result.data![0] as any).id === (item as any).id);
    };
  }
  
  /**
   * Pre-built validator for checking if a value is not empty
   */
  static notEmptyValidator<T>(field: keyof T): ValidatorFunction<T> {
    return (item: T) => {
      const value = item[field];
      return value !== null && 
             value !== undefined && 
             (typeof value !== 'string' || value.trim() !== '');
    };
  }
  
  /**
   * Pre-built validator for checking relationships
   */
  static relationshipValidator<T, R>(
    field: keyof T,
    relatedRepository: DataRepository<R>,
    relatedField: keyof R = 'id' as keyof R
  ): ValidatorFunction<T> {
    return async (item: T) => {
      const foreignKey = item[field];
      
      if (!foreignKey) return true; // Null foreign keys are valid
      
      const result = await relatedRepository
        .select()
        .eq(relatedField as string, foreignKey)
        .maybeSingle();
      
      return result.isSuccess() && result.data !== null;
    };
  }
}

/**
 * Performance testing utilities for repositories
 */
export class RepositoryPerformanceTester<T> {
  private repository: DataRepository<T>;
  private measurements: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    successful: boolean;
  }> = [];
  
  constructor(repository: DataRepository<T>) {
    this.repository = repository;
  }
  
  /**
   * Measure the performance of a repository operation
   */
  async measure<R>(
    operation: string, 
    callback: () => Promise<R>
  ): Promise<{ result: R; duration: number }> {
    const startTime = performance.now();
    let successful = true;
    
    try {
      const result = await callback();
      return { result, duration: performance.now() - startTime };
    } catch (error) {
      successful = false;
      logger.error(`Performance measurement error in ${operation}:`, error);
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.measurements.push({
        operation,
        duration,
        timestamp: Date.now(),
        successful
      });
    }
  }
  
  /**
   * Get all performance measurements
   */
  getMeasurements(operation?: string) {
    if (operation) {
      return this.measurements.filter(m => m.operation === operation);
    }
    return this.measurements;
  }
  
  /**
   * Get average duration for a specific operation
   */
  getAverageDuration(operation: string): number {
    const operationMeasurements = this.measurements
      .filter(m => m.operation === operation && m.successful);
    
    if (operationMeasurements.length === 0) return 0;
    
    const total = operationMeasurements.reduce(
      (sum, m) => sum + m.duration, 0
    );
    
    return total / operationMeasurements.length;
  }
  
  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements = [];
  }
  
  /**
   * Generate a performance report
   */
  generateReport(): Record<string, { 
    count: number; 
    avgDuration: number; 
    minDuration: number;
    maxDuration: number;
  }> {
    const operations = [...new Set(this.measurements.map(m => m.operation))];
    const report: Record<string, any> = {};
    
    for (const operation of operations) {
      const operationMeasurements = this.measurements
        .filter(m => m.operation === operation && m.successful);
      
      if (operationMeasurements.length === 0) {
        report[operation] = { count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0 };
        continue;
      }
      
      const durations = operationMeasurements.map(m => m.duration);
      const total = durations.reduce((sum, d) => sum + d, 0);
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      report[operation] = {
        count: operationMeasurements.length,
        avgDuration: total / operationMeasurements.length,
        minDuration: min,
        maxDuration: max
      };
    }
    
    return report;
  }
}
