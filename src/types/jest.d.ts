
/**
 * Type definitions for Jest
 * This file makes Jest globals available to TypeScript
 */

declare global {
  namespace jest {
    interface SpyInstance<T extends (...args: any[]) => any> {
      mockClear(): void;
      mockReset(): void;
      mockImplementation(fn: T): SpyInstance<T>;
      mockReturnValue(value: ReturnType<T>): SpyInstance<T>;
      mockResolvedValue(value: Awaited<ReturnType<T>>): SpyInstance<T>;
      mockRejectedValue(value: any): SpyInstance<T>;
      mockReturnThis(): SpyInstance<T>;
    }

    function spyOn<T extends {}, M extends keyof T>(
      object: T,
      method: M
    ): SpyInstance<T[M] extends (...args: any[]) => any ? T[M] : any>;

    function fn<T extends (...args: any[]) => any>(
      implementation?: T
    ): SpyInstance<T>;

    function mock(moduleName: string, factory?: () => any): void;
    function dontMock(moduleName: string): void;
    function resetModules(): void;
  }
}

// This empty export is needed to make this a module
export {};
