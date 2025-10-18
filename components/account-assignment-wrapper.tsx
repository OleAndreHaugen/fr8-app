"use client";

import { useState, useEffect, useRef } from "react";
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
  const { profile, loading, error } = useUserProfile();
  const hasCheckedAccount = useRef(false);

  // Single effect to handle account assignment after profile loads
  useEffect(() => {
    console.log("Effect running - loading:", loading, "hasChecked:", hasCheckedAccount.current);
    
    // Don't run if still loading
    if (loading) {
      console.log("Still loading, waiting...");
      return;
    }
    
    // Don't run if already checked
    if (hasCheckedAccount.current) {
      console.log("Already checked, skipping");
      return;
    }
    
    console.log("Running account assignment check...");
    // Mark as checked immediately to prevent re-runs
    hasCheckedAccount.current = true;
    
    const checkAccountAssignment = async () => {
      try {       
        // If user has an account assigned, nothing to do
        if (profile?.account_id) {
          console.log("User already has account:", profile.account_id);
          return;
        }

        // User doesn't have an account, try to auto-assign based on email domain
        const emaildomain = extractEmailDomain(user.email!);
        console.log("Checking for account with domain:", emaildomain);
        const matchingAccount = await findAccountByEmailDomain(emaildomain);
        console.log("Found matching account:", matchingAccount);

        if (matchingAccount) {
          // Found matching account, auto-assign user
          console.log("Auto-assigning user to account:", matchingAccount.id);
          setIsAssigning(true);
          
          try {
            await assignUserToAccount(user.id, matchingAccount.id);
            console.log("Successfully assigned user to account, reloading page...");
            
            // Refresh the page to update the layout
            window.location.reload();
          } catch (assignError) {
            console.error("Failed to assign user to account:", assignError);
            setIsAssigning(false);
            throw assignError;
          }
          return;
        } else {
          console.log("No matching account found, showing dialog");
        }
    
      } catch (error) {
        console.error("Error checking account assignment:", error);
        setIsAssigning(false);
      }
    };

    checkAccountAssignment();
  }, [loading]); // Only run when loading changes

  const handleDialogComplete = () => {
    // Refresh the page to re-run the account check
    window.location.reload();
  };

  // Show email verification error if user hasn't confirmed their email
  if (error && error.includes("verify your email")) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verification Required</h2>
            <p className="text-gray-600 mb-4">
              Please check your email and click the verification link to access the dashboard.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you don't see the email, check your spam folder.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
