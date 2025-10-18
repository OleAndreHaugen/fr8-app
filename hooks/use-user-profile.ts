"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"] & {
  accounts?: Database["public"]["Tables"]["accounts"]["Row"];
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useUserProfile effect running");
    let isMounted = true;
    const supabase = createClient();
    
    const fetchProfile = async () => {
      try {
        console.log("Starting to fetch profile");
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Check if user's email is confirmed
        if (!user.email_confirmed_at) {
          setError("Please verify your email address before accessing the dashboard.");
          setProfile(null);
          setLoading(false);
          return;
        }

        // First try to get the user profile without the accounts relationship
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(); // Use maybeSingle to avoid 406 errors

        if (!isMounted) return;
        
        if (error) {
          throw error;
        }

        if (data) {
          // If profile exists and has an account_id, fetch the account details separately
          if (data.account_id) {
            const { data: accountData, error: accountError } = await supabase
              .from("accounts")
              .select("id, name, type, status, emaildomain")
              .eq("id", data.account_id)
              .maybeSingle(); // Use maybeSingle to avoid 406 errors

            if (!isMounted) return;
            
            if (accountError) {
              console.warn("Failed to fetch account details:", accountError);
            }

            setProfile({
              ...data,
              accounts: accountData || undefined
            });
          } else {
            setProfile(data);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch profile");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = async (updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at" | "updated_at">>) => {
    try {
      setError(null);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("user_id", user.id)
          .select("*")
          .maybeSingle();

        if (error) throw error;
        
        // If profile has account_id, fetch account details separately
        if (data?.account_id) {
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .select("id, name, type, status, emaildomain")
            .eq("id", data.account_id)
            .maybeSingle();

          if (accountError) {
            console.warn("Failed to fetch account details:", accountError);
          }

          setProfile({
            ...data,
            accounts: accountData || undefined
          });
        } else {
          setProfile(data);
        }
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select("*")
          .maybeSingle();

        if (error) throw error;
        
        // If profile has account_id, fetch account details separately
        if (data?.account_id) {
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .select("id, name, type, status, emaildomain")
            .eq("id", data.account_id)
            .maybeSingle();

          if (accountError) {
            console.warn("Failed to fetch account details:", accountError);
          }

          setProfile({
            ...data,
            accounts: accountData || undefined
          });
        } else {
          setProfile(data);
        }
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
}
