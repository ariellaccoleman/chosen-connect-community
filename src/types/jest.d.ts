
/**
 * Type declarations for Jest in the global scope
 * This will make TypeScript recognize Jest's functions and methods
 */

declare global {
  const jest: {
    spyOn: <T extends {}, M extends keyof T>(object: T, method: M) => jest.SpyInstance<any, any>;
    fn: <T = any>(implementation?: (...args: any[]) => T) => jest.Mock<T>;
    mock: (moduleName: string, factory?: any) => void;
    resetModules: () => void;
    dontMock: (moduleName: string) => void;
  };

  namespace jest {
    interface SpyInstance<T = any, Y extends any[] = any[]> {
      mockClear: () => SpyInstance<T, Y>;
      mockReset: () => SpyInstance<T, Y>;
      mockRestore: () => void;
      mockImplementation: (fn: (...args: Y) => T) => SpyInstance<T, Y>;
      mockReturnValue: (val: T) => SpyInstance<T, Y>;
      mockReturnValueOnce: (val: T) => SpyInstance<T, Y>;
      mockResolvedValue: (val: Awaited<T>) => SpyInstance<T, Y>;
      mockRejectedValue: (val: any) => SpyInstance<T, Y>;
      mockResolvedValueOnce: (val: Awaited<T>) => SpyInstance<T, Y>;
      mockRejectedValueOnce: (val: any) => SpyInstance<T, Y>;
      mockReturnThis: () => SpyInstance<T, Y>;
      mockName: (name: string) => SpyInstance<T, Y>;
    }

    interface Mock<T = any> extends Function {
      mockClear: () => Mock<T>;
      mockReset: () => Mock<T>;
      mockRestore: () => void;
      mockImplementation: (fn: (...args: any[]) => T) => Mock<T>;
      mockReturnValue: (val: T) => Mock<T>;
      mockReturnValueOnce: (val: T) => Mock<T>;
      mockResolvedValue: (val: Awaited<T>) => Mock<T>;
      mockRejectedValue: (val: any) => Mock<T>;
      mockResolvedValueOnce: (val: Awaited<T>) => Mock<T>;
      mockRejectedValueOnce: (val: any) => Mock<T>;
      mockReturnThis: () => Mock<T>;
      mockName: (name: string) => Mock<T>;
      mock: {
        calls: any[][];
        instances: any[];
        invocationCallOrder: number[];
        results: { type: string; value: any }[];
      };
    }
  }
}

export {};
