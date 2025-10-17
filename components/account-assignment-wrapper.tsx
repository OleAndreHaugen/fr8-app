"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { AccountAssignmentDialog } from "@/components/account-assignment-dialog";
import { 
  findAccountByEmailDomain, 
  extractEmailDomain,
  assignUserToAccount 
} from "@/lib/account-utils";
import { useUserProfile } from "@/hooks/use-user-profile";

interface AccountAssignmentWrapperProps {
  user: User;
  children: React.ReactNode;
}

export function AccountAssignmentWrapper({ user, children }: AccountAssignmentWrapperProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const { profile, loading } = useUserProfile();

  useEffect(() => {
    const checkAccountAssignment = async () => {
      // Wait for profile to load
      if (loading) return;
      
      try {       
        // If user has an account assigned, show dashboard
        if (profile?.account_id) {
          return;
        }

        // User doesn't have an account, try to auto-assign based on email domain
        const emaildomain = extractEmailDomain(user.email!);
        const matchingAccount = await findAccountByEmailDomain(emaildomain);

        if (matchingAccount) {
          // Found matching account, auto-assign user
          setIsAssigning(true);
          await assignUserToAccount(user.id, matchingAccount.id);
          
          // Refresh the page to update the layout
          window.location.reload();
          return;
        }
    
      } catch (error) {
        console.error("Error checking account assignment:", error);
      } finally {
        setIsAssigning(false);
      }
    };

    checkAccountAssignment();
  }, [profile, loading, user.id, user.email]);

  const handleDialogComplete = () => {
    // Refresh the page to re-run the account check
    window.location.reload();
  };

  // Show loading state while profile is loading or assigning
  if (loading || isAssigning) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isAssigning ? "Assigning you to account..." : "Loading profile..."}
          </p>
        </div>
      </div>
    );
  }

  // If user has an account assigned, show dashboard content
  if (profile?.account_id) {
    return <>{children}</>;
  }

  // User doesn't have an account, show assignment dialog
  return (
    <AccountAssignmentDialog 
      userEmail={user.email!} 
      onComplete={handleDialogComplete}
    />
  );
}
