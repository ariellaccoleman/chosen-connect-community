
import { logger } from '@/utils/logger';

/**
 * Error severity levels for categorizing the impact of errors
 */
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues that don't prevent operation
  MEDIUM = 'medium',     // Issues that may cause degraded performance
  HIGH = 'high',         // Issues that prevent normal operation
  CRITICAL = 'critical'  // Issues that completely break functionality
}

/**
 * Error categories for better classification
 */
export enum ErrorCategory {
  NETWORK = 'network',           // Connection, timeout, DNS issues
  PERMISSION = 'permission',     // Authorization, RLS, access control
  SQL = 'sql',                   // Syntax errors, invalid queries
  CONSTRAINT = 'constraint',     // Foreign key, unique, check constraints
  INFRASTRUCTURE = 'infrastructure', // Missing functions, schema issues
  VALIDATION = 'validation',     // Data validation, type mismatches
  TRANSACTION = 'transaction',   // Transaction rollback, deadlock
  RESOURCE = 'resource'          // Memory, disk space, limits
}

/**
 * Recovery suggestions for different error types
 */
export const RecoverySuggestions = {
  [ErrorCategory.NETWORK]: [
    'Check internet connection',
    'Verify Supabase project is accessible',
    'Try again after a brief delay',
    'Check for service status issues'
  ],
  [ErrorCategory.PERMISSION]: [
    'Verify RLS policies allow the operation',
    'Check user authentication status',
    'Ensure proper database permissions',
    'Review security definer function permissions'
  ],
  [ErrorCategory.SQL]: [
    'Check SQL syntax for errors',
    'Verify table and column names exist',
    'Ensure proper data types are used',
    'Validate query structure'
  ],
  [ErrorCategory.CONSTRAINT]: [
    'Check foreign key relationships',
    'Verify unique constraints are satisfied',
    'Ensure required fields are not null',
    'Review check constraint conditions'
  ],
  [ErrorCategory.INFRASTRUCTURE]: [
    'Verify required database functions exist',
    'Check schema exists and is accessible',
    'Ensure proper database setup',
    'Review migration status'
  ],
  [ErrorCategory.VALIDATION]: [
    'Check data format and types',
    'Verify required fields are present',
    'Ensure data meets business rules',
    'Review input validation logic'
  ],
  [ErrorCategory.TRANSACTION]: [
    'Retry the operation',
    'Check for concurrent modifications',
    'Review transaction isolation level',
    'Ensure proper transaction cleanup'
  ],
  [ErrorCategory.RESOURCE]: [
    'Check available system resources',
    'Review query complexity and size',
    'Consider breaking operation into smaller parts',
    'Monitor system performance'
  ]
};

/**
 * Detailed error information with context and suggestions
 */
export interface EnhancedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError?: unknown;
  context: ErrorContext;
  suggestions: string[];
  timestamp: Date;
  stackTrace?: string;
}

/**
 * Context information for tracking error location and state
 */
export interface ErrorContext {
  operation: string;           // What operation was being performed
  step: string;               // Which step in the operation failed
  schemaName?: string;        // Schema being operated on
  tableName?: string;         // Table being operated on
  functionName?: string;      // Function being called
  parameters?: Record<string, unknown>; // Parameters passed to operation
  metadata?: Record<string, unknown>;   // Additional context data
}

/**
 * Error classifier that determines category and severity from error details
 */
export class ErrorClassifier {
  /**
   * Classify an error based on its message and context
   */
  static classify(error: unknown, context: ErrorContext): { category: ErrorCategory; severity: ErrorSeverity } {
    const errorMessage = this.extractErrorMessage(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Network-related errors
    if (this.isNetworkError(lowerMessage)) {
      return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH };
    }

    // Permission-related errors
    if (this.isPermissionError(lowerMessage)) {
      return { category: ErrorCategory.PERMISSION, severity: ErrorSeverity.HIGH };
    }

    // SQL syntax and query errors
    if (this.isSqlError(lowerMessage)) {
      return { category: ErrorCategory.SQL, severity: ErrorSeverity.MEDIUM };
    }

    // Constraint violations
    if (this.isConstraintError(lowerMessage)) {
      return { category: ErrorCategory.CONSTRAINT, severity: ErrorSeverity.MEDIUM };
    }

    // Infrastructure issues
    if (this.isInfrastructureError(lowerMessage, context)) {
      return { category: ErrorCategory.INFRASTRUCTURE, severity: ErrorSeverity.CRITICAL };
    }

    // Transaction issues
    if (this.isTransactionError(lowerMessage)) {
      return { category: ErrorCategory.TRANSACTION, severity: ErrorSeverity.HIGH };
    }

    // Resource issues
    if (this.isResourceError(lowerMessage)) {
      return { category: ErrorCategory.RESOURCE, severity: ErrorSeverity.HIGH };
    }

    // Default to validation error for unclassified errors
    return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.MEDIUM };
  }

  private static isNetworkError(message: string): boolean {
    return message.includes('network') ||
           message.includes('connection') ||
           message.includes('timeout') ||
           message.includes('unreachable') ||
           message.includes('dns') ||
           message.includes('fetch failed');
  }

  private static isPermissionError(message: string): boolean {
    return message.includes('permission denied') ||
           message.includes('access denied') ||
           message.includes('unauthorized') ||
           message.includes('row-level security') ||
           message.includes('rls') ||
           message.includes('authentication');
  }

  private static isSqlError(message: string): boolean {
    return message.includes('syntax error') ||
           message.includes('invalid sql') ||
           message.includes('does not exist') ||
           message.includes('column') && message.includes('does not exist') ||
           message.includes('relation') && message.includes('does not exist');
  }

  private static isConstraintError(message: string): boolean {
    return message.includes('foreign key') ||
           message.includes('unique constraint') ||
           message.includes('check constraint') ||
           message.includes('not null') ||
           message.includes('violates');
  }

  private static isInfrastructureError(message: string, context: ErrorContext): boolean {
    return message.includes('function does not exist') ||
           message.includes('schema does not exist') ||
           message.includes('pg_get_tabledef') ||
           message.includes('exec_sql') ||
           context.operation.includes('schema') && message.includes('does not exist');
  }

  private static isTransactionError(message: string): boolean {
    return message.includes('transaction') ||
           message.includes('deadlock') ||
           message.includes('rollback') ||
           message.includes('serialization failure');
  }

  private static isResourceError(message: string): boolean {
    return message.includes('out of memory') ||
           message.includes('disk full') ||
           message.includes('too many') ||
           message.includes('limit exceeded') ||
           message.includes('resource');
  }

  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error';
  }
}

/**
 * Enhanced error creator that builds detailed error objects
 */
export class EnhancedErrorBuilder {
  private context: ErrorContext;

  constructor(context: ErrorContext) {
    this.context = context;
  }

  /**
   * Create an enhanced error with full context and suggestions
   */
  createError(error: unknown): EnhancedError {
    const { category, severity } = ErrorClassifier.classify(error, this.context);
    const message = this.extractErrorMessage(error);
    const suggestions = RecoverySuggestions[category] || [];

    const enhancedError: EnhancedError = {
      id: this.generateErrorId(),
      category,
      severity,
      message,
      originalError: error,
      context: this.context,
      suggestions,
      timestamp: new Date(),
      stackTrace: error instanceof Error ? error.stack : undefined
    };

    // Log the enhanced error
    this.logError(enhancedError);

    return enhancedError;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error occurred';
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private logError(error: EnhancedError): void {
    const logMessage = `[${error.category.toUpperCase()}] ${error.context.operation} - ${error.context.step}: ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(logMessage, {
          errorId: error.id,
          context: error.context,
          suggestions: error.suggestions
        });
        break;
      case ErrorSeverity.HIGH:
        logger.error(logMessage, { errorId: error.id, context: error.context });
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(logMessage, { errorId: error.id, context: error.context });
        break;
      case ErrorSeverity.LOW:
        logger.info(logMessage, { errorId: error.id });
        break;
    }
  }
}

/**
 * Step tracker for monitoring operation progress and context
 */
export class OperationStepTracker {
  private steps: Array<{ step: string; timestamp: Date; status: 'pending' | 'completed' | 'failed' }> = [];
  private context: ErrorContext;

  constructor(operation: string, initialContext: Partial<ErrorContext> = {}) {
    this.context = {
      operation,
      step: 'initialization',
      ...initialContext
    };
  }

  /**
   * Start a new step in the operation
   */
  startStep(step: string, metadata?: Record<string, unknown>): void {
    this.context.step = step;
    if (metadata) {
      this.context.metadata = { ...this.context.metadata, ...metadata };
    }

    this.steps.push({
      step,
      timestamp: new Date(),
      status: 'pending'
    });

    logger.debug(`Starting step: ${step}`, { operation: this.context.operation, metadata });
  }

  /**
   * Mark current step as completed
   */
  completeStep(): void {
    const currentStep = this.steps[this.steps.length - 1];
    if (currentStep) {
      currentStep.status = 'completed';
      logger.debug(`Completed step: ${currentStep.step}`, { operation: this.context.operation });
    }
  }

  /**
   * Create an enhanced error with current step context
   */
  createError(error: unknown): EnhancedError {
    // Mark current step as failed
    const currentStep = this.steps[this.steps.length - 1];
    if (currentStep) {
      currentStep.status = 'failed';
    }

    const builder = new EnhancedErrorBuilder({
      ...this.context,
      metadata: {
        ...this.context.metadata,
        completedSteps: this.steps.filter(s => s.status === 'completed').map(s => s.step),
        failedStep: currentStep?.step,
        totalSteps: this.steps.length
      }
    });

    return builder.createError(error);
  }

  /**
   * Get the current context for error reporting
   */
  getContext(): ErrorContext {
    return { ...this.context };
  }

  /**
   * Update context parameters
   */
  updateContext(updates: Partial<ErrorContext>): void {
    this.context = { ...this.context, ...updates };
  }
}
