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
      ports: {
        Row: {
          id: string;
          name: string;
          country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          country?: string;
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
      ffa_hist: {
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
      accounts: {
        Row: {
          id: string;
          name: string;
          type: string;
          status: string;
          emaildomain: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          status: string;
          emaildomain: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          status?: string;
          emaildomain?: string;
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
          account_id: string | null;
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
          account_id?: string | null;
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
          account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          account_id: string | null;
          customer: string | null;
          route: string | null;
          port_load: string | null;
          port_disch: string | null;
          terms_load: string | null;
          terms_disch: string | null;
          rate_load: number | null;
          rate_disch: number | null;
          difference: number | null;
          duration: number | null;
          total_vlsfo: number | null;
          total_lsmgo: number | null;
          total_pda: number | null;
          total_misc: number | null;
          commission: number | null;
          commission_adress: number | null;
          intake: number | null;
          intake_tolerance: string | null;
          rate: number | null;
          fuel: string | null;
          terms: string | null;
          diff_jan: number | null;
          diff_feb: number | null;
          diff_mar: number | null;
          diff_apr: number | null;
          diff_may: number | null;
          diff_jun: number | null;
          diff_jul: number | null;
          diff_aug: number | null;
          diff_sep: number | null;
          diff_oct: number | null;
          diff_nov: number | null;
          diff_dec: number | null;
          sys_name: string | null;
          rates: Json | null;
          active: boolean | null;
          stemsize: number | null;
          diff_jan_unit: string | null;
          diff_feb_unit: string | null;
          diff_mar_unit: string | null;
          diff_apr_unit: string | null;
          diff_may_unit: string | null;
          diff_jun_unit: string | null;
          diff_jul_unit: string | null;
          diff_aug_unit: string | null;
          diff_sep_unit: string | null;
          diff_oct_unit: string | null;
          diff_nov_unit: string | null;
          diff_dec_unit: string | null;
          fobid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          customer?: string | null;
          route?: string | null;
          port_load?: string | null;
          port_disch?: string | null;
          terms_load?: string | null;
          terms_disch?: string | null;
          rate_load?: number | null;
          rate_disch?: number | null;
          difference?: number | null;
          duration?: number | null;
          total_vlsfo?: number | null;
          total_lsmgo?: number | null;
          total_pda?: number | null;
          total_misc?: number | null;
          commission?: number | null;
          commission_adress?: number | null;
          intake?: number | null;
          intake_tolerance?: string | null;
          rate?: number | null;
          fuel?: string | null;
          terms?: string | null;
          diff_jan?: number | null;
          diff_feb?: number | null;
          diff_mar?: number | null;
          diff_apr?: number | null;
          diff_may?: number | null;
          diff_jun?: number | null;
          diff_jul?: number | null;
          diff_aug?: number | null;
          diff_sep?: number | null;
          diff_oct?: number | null;
          diff_nov?: number | null;
          diff_dec?: number | null;
          sys_name?: string | null;
          rates?: Json | null;
          active?: boolean | null;
          stemsize?: number | null;
          diff_jan_unit?: string | null;
          diff_feb_unit?: string | null;
          diff_mar_unit?: string | null;
          diff_apr_unit?: string | null;
          diff_may_unit?: string | null;
          diff_jun_unit?: string | null;
          diff_jul_unit?: string | null;
          diff_aug_unit?: string | null;
          diff_sep_unit?: string | null;
          diff_oct_unit?: string | null;
          diff_nov_unit?: string | null;
          diff_dec_unit?: string | null;
          fobid?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string | null;
          customer?: string | null;
          route?: string | null;
          port_load?: string | null;
          port_disch?: string | null;
          terms_load?: string | null;
          terms_disch?: string | null;
          rate_load?: number | null;
          rate_disch?: number | null;
          difference?: number | null;
          duration?: number | null;
          total_vlsfo?: number | null;
          total_lsmgo?: number | null;
          total_pda?: number | null;
          total_misc?: number | null;
          commission?: number | null;
          commission_adress?: number | null;
          intake?: number | null;
          intake_tolerance?: string | null;
          rate?: number | null;
          fuel?: string | null;
          terms?: string | null;
          diff_jan?: number | null;
          diff_feb?: number | null;
          diff_mar?: number | null;
          diff_apr?: number | null;
          diff_may?: number | null;
          diff_jun?: number | null;
          diff_jul?: number | null;
          diff_aug?: number | null;
          diff_sep?: number | null;
          diff_oct?: number | null;
          diff_nov?: number | null;
          diff_dec?: number | null;
          sys_name?: string | null;
          rates?: Json | null;
          active?: boolean | null;
          stemsize?: number | null;
          diff_jan_unit?: string | null;
          diff_feb_unit?: string | null;
          diff_mar_unit?: string | null;
          diff_apr_unit?: string | null;
          diff_may_unit?: string | null;
          diff_jun_unit?: string | null;
          diff_jul_unit?: string | null;
          diff_aug_unit?: string | null;
          diff_sep_unit?: string | null;
          diff_oct_unit?: string | null;
          diff_nov_unit?: string | null;
          diff_dec_unit?: string | null;
          fobid?: string | null;
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

