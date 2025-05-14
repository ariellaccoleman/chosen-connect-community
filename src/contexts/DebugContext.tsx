
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface DebugContextType {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
  logRender: (componentName: string, props?: any) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const useDebug = (): DebugContextType => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

interface DebugProviderProps {
  children: ReactNode;
  initialDebugMode?: boolean;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({
  children,
  initialDebugMode = process.env.NODE_ENV === 'development',
}) => {
  const [debugMode, setDebugMode] = useState<boolean>(initialDebugMode);
  
  // Enable/disable logger based on debug mode
  logger.setDebugEnabled(debugMode);
  
  const logRender = (componentName: string, props?: any) => {
    if (debugMode) {
      logger.debug(`Rendering component: ${componentName}`, props);
    }
  };
  
  const value = {
    debugMode,
    setDebugMode,
    logRender,
  };
  
  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};

export default DebugProvider;
