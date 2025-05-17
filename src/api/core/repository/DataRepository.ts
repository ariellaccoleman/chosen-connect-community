
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
  select(select?: string): RepositoryQuery<T>;

  /**
   * Insert data into the database
   * @param data Data to insert
   * @returns Query builder for insert operation
   */
  insert(data: Record<string, any> | Record<string, any>[]): RepositoryQuery<T>;

  /**
   * Update data in the database
   * @param data Data to update
   * @returns Query builder for update operation
   */
  update(data: Record<string, any>): RepositoryQuery<T>;

  /**
   * Delete records from the database
   * @returns Query builder for delete operation
   */
  delete(): RepositoryQuery<T>;

  /**
   * Set repository options
   * @param options Repository configuration options
   */
  setOptions?(options: Record<string, any>): void;
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
   * @param options Additional options like count
   * @returns The query builder for chaining
   */
  select(select?: string, options?: { count?: boolean }): RepositoryQuery<T>;
  
  /**
   * Get a single result
   * @returns Promise with the repository response
   */
  single(): Promise<RepositoryResponse<T>>;
  
  /**
   * Get a single result or null if not found
   * @returns Promise with the repository response
   */
  maybeSingle(): Promise<RepositoryResponse<T | null>>;
  
  /**
   * Execute the query and get results
   * @returns Promise with the repository response
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
