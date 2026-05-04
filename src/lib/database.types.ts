/**
 * Supabase Database Types
 * Auto-generated types placeholder.
 * Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Add your Supabase database types here after generating them
export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}