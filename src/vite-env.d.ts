
/// <reference types="vite/client" />

// Declare module for any image imports
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.svg';
declare module '*.gif';

// Declare module for CSS/SCSS imports
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

// Declare environment variables that might be used in the application
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
