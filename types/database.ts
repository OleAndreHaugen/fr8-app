/**
 * Database types
 * 
 * Generate types from your Supabase schema:
 * npx supabase gen types typescript --project-id your-project-id > types/database.ts
 * 
 * Or with the Supabase CLI:
 * supabase gen types typescript --local > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      fuel: {
        Row: {
          id: string;
          type: string;
          product: string;
          price: number;
          price_prev: number | null;
          forward: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          product: string;
          price: number;
          price_prev?: number | null;
          forward?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          product?: string;
          price?: number;
          price_prev?: number | null;
          forward?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fuel_codes: {
        Row: {
          id: string;
          code: string;
          port: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          port: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          port?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ffa: {
        Row: {
          id: string;
          contract: string;
          forward: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract: string;
          forward?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract?: string;
          forward?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fuel_hist: {
        Row: {
          id: string;
          product: string;
          type: string;
          price: number;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product: string;
          type: string;
          price: number;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product?: string;
          type?: string;
          price?: number;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          title: string | null;
          mobile: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          title?: string | null;
          mobile?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          title?: string | null;
          mobile?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

