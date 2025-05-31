
/**
 * Read-Only Repository Interface
 * Defines only read operations for repositories that don't need write capabilities
 */
export interface ReadOnlyRepository<T = any> {
  /**
   * Get table/view name this repository is working with
   */
  tableName: string;

  /**
   * Get a record by ID
   * @param id ID of the record to retrieve
   * @returns Promise with the record or null if not found
   */
  getById(id: string | number): Promise<T | null>;

  /**
   * Get all records
   * @returns Promise with an array of records
   */
  getAll(): Promise<T[]>;

  /**
   * Select records from the database
   * @param select Fields to select
   * @returns Query builder that can be further chained
   */
  select(select?: string): ReadOnlyRepositoryQuery<T>;

  /**
   * Set repository options
   * @param options Repository configuration options
   */
  setOptions?(options: Record<string, any>): void;
}

/**
 * Read-Only Repository Query Interface
 * Represents a chainable query builder for read-only repository operations
 */
export interface ReadOnlyRepositoryQuery<T = any> {
  /**
   * Filter by equality condition
   * @param column Column name
   * @param value Value to match
   * @returns The query builder for chaining
   */
  eq(column: string, value: any): ReadOnlyRepositoryQuery<T>;

  /**
   * Filter by inequality condition
   * @param column Column name
   * @param value Value to not match
   * @returns The query builder for chaining
   */
  neq(column: string, value: any): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter by values in an array
   * @param column Column name
   * @param values Array of values to match
   * @returns The query builder for chaining
   */
  in(column: string, values: any[]): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter using case-insensitive pattern matching
   * @param column Column name
   * @param pattern Pattern to match
   * @returns The query builder for chaining
   */
  ilike(column: string, pattern: string): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter for NULL values
   * @param column Column name
   * @param isNull Whether the value should be NULL (true) or NOT NULL (false)
   * @returns The query builder for chaining
   */
  is(column: string, isNull: null | boolean): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter by greater than
   * @param column Column name
   * @param value Value to compare
   * @returns The query builder for chaining
   */
  gt(column: string, value: any): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter by greater than or equal to
   * @param column Column name
   * @param value Value to compare
   * @returns The query builder for chaining
   */
  gte(column: string, value: any): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter by less than
   * @param column Column name
   * @param value Value to compare
   * @returns The query builder for chaining
   */
  lt(column: string, value: any): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter by less than or equal to
   * @param column Column name
   * @param value Value to compare
   * @returns The query builder for chaining
   */
  lte(column: string, value: any): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter with OR conditions
   * @param filter A string representing OR conditions in the format "column.operator.value,column.operator.value"
   * @returns The query builder for chaining
   */
  or(filter: string): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Filter by array overlap (PostgreSQL arrays)
   * @param column Column name (should be an array column)
   * @param values Array of values to check for overlap
   * @returns The query builder for chaining
   */
  overlaps(column: string, values: any[]): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Order results by a column
   * @param column Column to order by
   * @param options Options for ordering
   * @returns The query builder for chaining
   */
  order(column: string, options?: { ascending?: boolean }): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Limit the number of results
   * @param count Maximum number of results
   * @returns The query builder for chaining
   */
  limit(count: number): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Skip a number of results
   * @param count Number of results to skip
   * @returns The query builder for chaining
   */
  offset(count: number): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Get a range of results
   * @param from Starting index
   * @param to Ending index
   * @returns The query builder for chaining
   */
  range(from: number, to: number): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Select specific fields
   * @param select Fields to select
   * @param options Additional options like count
   * @returns The query builder for chaining
   */
  select(select?: string, options?: { count?: boolean }): ReadOnlyRepositoryQuery<T>;
  
  /**
   * Get a single result
   * @returns Promise with the repository response
   */
  single(): Promise<ReadOnlyRepositoryResponse<T>>;
  
  /**
   * Get a single result or null if not found
   * @returns Promise with the repository response
   */
  maybeSingle(): Promise<ReadOnlyRepositoryResponse<T | null>>;
  
  /**
   * Execute the query and get results
   * @returns Promise with the repository response
   */
  execute(): Promise<ReadOnlyRepositoryResponse<T[]>>;
}

/**
 * Read-Only Repository Response Interface
 * Standardized response format for read-only repository operations
 */
export interface ReadOnlyRepositoryResponse<T> {
  data: T | null;
  error: ReadOnlyRepositoryError | null;
  
  /**
   * Helper method to check if the response was successful
   */
  isSuccess(): boolean;
  
  /**
   * Helper method to check if the response had an error
   */
  isError(): boolean;
  
  /**
   * Get a formatted error message if there was an error
   */
  getErrorMessage(): string;
}

/**
 * Read-Only Repository Error Interface
 * Aligned with ApiError for consistency
 */
export interface ReadOnlyRepositoryError {
  code: string;
  message: string;
  details?: any;
  original?: any;
}
