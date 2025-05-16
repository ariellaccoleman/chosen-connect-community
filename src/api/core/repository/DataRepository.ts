
/**
 * Data Repository Interface
 * Abstracts database operations to make testing easier and improve code organization
 */
export interface DataRepository<T = any> {
  /**
   * Get table name this repository is working with
   */
  tableName: string;

  /**
   * Select records from the database
   * @param select Fields to select
   * @returns Query builder that can be further chained
   */
  select(select?: string): RepositoryQuery<T>;

  /**
   * Insert data into the database
   * @param data Data to insert
   * @returns Query builder that can be further chained
   */
  insert(data: any): RepositoryQuery<T>;

  /**
   * Update data in the database
   * @param data Data to update
   * @returns Query builder that can be further chained
   */
  update(data: any): RepositoryQuery<T>;

  /**
   * Delete data from the database
   * @returns Query builder that can be further chained
   */
  delete(): RepositoryQuery<T>;
}

/**
 * Repository Query Interface
 * Represents a chainable query builder for repository operations
 */
export interface RepositoryQuery<T = any> {
  /**
   * Filter by equality condition
   * @param column Column name
   * @param value Value to match
   * @returns The query builder for chaining
   */
  eq(column: string, value: any): RepositoryQuery<T>;

  /**
   * Filter by inequality condition
   * @param column Column name
   * @param value Value to not match
   * @returns The query builder for chaining
   */
  neq(column: string, value: any): RepositoryQuery<T>;
  
  /**
   * Filter by values in an array
   * @param column Column name
   * @param values Array of values to match
   * @returns The query builder for chaining
   */
  in(column: string, values: any[]): RepositoryQuery<T>;
  
  /**
   * Filter using case-insensitive pattern matching
   * @param column Column name
   * @param pattern Pattern to match
   * @returns The query builder for chaining
   */
  ilike(column: string, pattern: string): RepositoryQuery<T>;
  
  /**
   * Order results by a column
   * @param column Column to order by
   * @param options Options for ordering
   * @returns The query builder for chaining
   */
  order(column: string, options?: { ascending?: boolean }): RepositoryQuery<T>;
  
  /**
   * Limit the number of results
   * @param count Maximum number of results
   * @returns The query builder for chaining
   */
  limit(count: number): RepositoryQuery<T>;
  
  /**
   * Get a range of results
   * @param from Starting index
   * @param to Ending index
   * @returns The query builder for chaining
   */
  range(from: number, to: number): RepositoryQuery<T>;
  
  /**
   * Select specific fields
   * @param select Fields to select
   * @returns The query builder for chaining
   */
  select(select?: string): RepositoryQuery<T>;
  
  /**
   * Get a single result
   * @returns Promise with the result
   */
  single(): Promise<RepositoryResponse<T>>;
  
  /**
   * Get a single result or null if not found
   * @returns Promise with the result or null
   */
  maybeSingle(): Promise<RepositoryResponse<T | null>>;
  
  /**
   * Execute the query and get results
   * @returns Promise with the results
   */
  execute(): Promise<RepositoryResponse<T[]>>;
}

/**
 * Repository Response Interface
 * Standardized response format for repository operations
 */
export interface RepositoryResponse<T> {
  data: T | null;
  error: RepositoryError | null;
  status: 'success' | 'error';
  
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
 * Repository Error Interface
 * Aligned with ApiError for consistency
 */
export interface RepositoryError {
  code: string;
  message: string;
  details?: any;
  original?: any;
}
