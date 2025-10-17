"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"] & {
  accounts?: Database["public"]["Tables"]["accounts"]["Row"];
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_profiles")
          .select(`
            *,
            accounts (
              id,
              name,
              type,
              status,
              emaildomain
            )
          `)
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
          throw error;
        }

        setProfile(data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  const updateProfile = async (updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at" | "updated_at">>) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("user_id", user.id)
          .select(`
            *,
            accounts (
              id,
              name,
              type,
              status,
              emaildomain
            )
          `)
          .single();

        if (error) throw error;
        setProfile(data);
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select(`
            *,
            accounts (
              id,
              name,
              type,
              status,
              emaildomain
            )
          `)
          .single();

        if (error) throw error;
        setProfile(data);
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
