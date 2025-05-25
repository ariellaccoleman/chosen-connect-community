
/**
 * Enhanced error handling types for testing infrastructure
 */

export enum ErrorCategory {
  INFRASTRUCTURE = 'infrastructure',
  SCHEMA = 'schema',
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  DATA = 'data',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface EnhancedError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: Record<string, any>;
  timestamp: Date;
  stack?: string;
  originalError?: Error;
  step?: string;
  operation?: string;
}

/**
 * Operation step tracker for enhanced error context
 */
export class OperationStepTracker {
  private operation: string;
  private currentStep?: string;
  private context: Record<string, any>;
  private startTime: Date;

  constructor(operation: string, initialContext: Record<string, any> = {}) {
    this.operation = operation;
    this.context = initialContext;
    this.startTime = new Date();
  }

  startStep(step: string, stepContext: Record<string, any> = {}): void {
    this.currentStep = step;
    this.context = { ...this.context, ...stepContext };
  }

  completeStep(): void {
    this.currentStep = undefined;
  }

  createError(error: any, category: ErrorCategory = ErrorCategory.UNKNOWN, severity: ErrorSeverity = ErrorSeverity.MEDIUM): EnhancedError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    return {
      id: this.generateErrorId(),
      message: errorMessage,
      category: this.categorizeError(error),
      severity: this.determineSeverity(error, severity),
      context: {
        operation: this.operation,
        step: this.currentStep,
        ...this.context
      },
      timestamp: new Date(),
      stack,
      originalError: error instanceof Error ? error : undefined,
      step: this.currentStep,
      operation: this.operation
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private categorizeError(error: any): ErrorCategory {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    if (message.includes('permission') || message.includes('access denied') || message.includes('unauthorized')) {
      return ErrorCategory.PERMISSION;
    }
    
    if (message.includes('schema') || message.includes('table') || message.includes('column')) {
      return ErrorCategory.SCHEMA;
    }
    
    if (message.includes('connection') || message.includes('network') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (message.includes('auth') || message.includes('token') || message.includes('session')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('infrastructure') || message.includes('function') || message.includes('rpc')) {
      return ErrorCategory.INFRASTRUCTURE;
    }
    
    if (message.includes('data') || message.includes('insert') || message.includes('update') || message.includes('delete')) {
      return ErrorCategory.DATA;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  private determineSeverity(error: any, defaultSeverity: ErrorSeverity): ErrorSeverity {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('cannot proceed')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('failed') || message.includes('error') || message.includes('exception')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM;
    }
    
    if (message.includes('info') || message.includes('notice')) {
      return ErrorSeverity.LOW;
    }
    
    return defaultSeverity;
  }
}

/**
 * Enhanced error formatting utilities
 */
export class ErrorFormatter {
  static formatEnhancedError(error: EnhancedError): string {
    const timestamp = error.timestamp.toISOString();
    const context = Object.keys(error.context).length > 0 
      ? `\nContext: ${JSON.stringify(error.context, null, 2)}`
      : '';
    
    return `[${timestamp}] ${error.severity.toUpperCase()} ${error.category}: ${error.message}${context}`;
  }

  static formatMultipleErrors(errors: EnhancedError[]): string {
    if (errors.length === 0) return 'No errors';
    
    const summary = `Found ${errors.length} error(s):\n`;
    const details = errors.map((error, index) => 
      `${index + 1}. ${this.formatEnhancedError(error)}`
    ).join('\n\n');
    
    return summary + details;
  }

  static groupErrorsByCategory(errors: EnhancedError[]): Record<ErrorCategory, EnhancedError[]> {
    const grouped: Record<ErrorCategory, EnhancedError[]> = {} as Record<ErrorCategory, EnhancedError[]>;
    
    // Initialize all categories
    Object.values(ErrorCategory).forEach(category => {
      grouped[category] = [];
    });
    
    // Group errors
    errors.forEach(error => {
      grouped[error.category].push(error);
    });
    
    return grouped;
  }
}
