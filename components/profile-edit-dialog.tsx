"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/hooks/use-auth";
import { getAccountUsers, updateAccountName } from "@/lib/account-utils";
import { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"] & {
  accounts?: Database["public"]["Tables"]["accounts"]["Row"];
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  mobile: z.string().min(1, "Mobile number is required"),
});

const accountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AccountFormData = z.infer<typeof accountSchema>;

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [accountUsers, setAccountUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      title: "",
      mobile: "",
    },
  });

  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountName: "",
    },
  });

  // Reset forms when profile data changes
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        title: profile.title || "",
        mobile: profile.mobile || "",
      });

      if (profile.accounts) {
        accountForm.reset({
          accountName: profile.accounts.name || "",
        });
      }
    }
  }, [profile, profileForm, accountForm]);

  // Load account users when dialog opens
  useEffect(() => {
    if (open && profile?.account_id) {
      loadAccountUsers();
    }
  }, [open, profile?.account_id]);

  const loadAccountUsers = async () => {
    if (!profile?.account_id) return;
    
    setLoadingUsers(true);
    try {
      const users = await getAccountUsers(profile.account_id);
      setAccountUsers(users);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load account users",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateProfile(data);

      if (result.success) {
        toast({
          variant: "success",
          title: "Success",
          description: "Profile updated successfully!",
        });
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update profile",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitAccount = async (data: AccountFormData) => {
    if (!profile?.account_id) return;

    setIsUpdatingAccount(true);

    try {
      await updateAccountName(profile.account_id, data.accountName);
      
      toast({
        variant: "success",
        title: "Success",
        description: "Account updated successfully!",
      });
      
      // Reload profile to get updated account name
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update account",
      });
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Validated":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Not Validated":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile & Account Settings</DialogTitle>
          <DialogDescription>
            Manage your profile information and account details.
          </DialogDescription>
        </DialogHeader>

        {/* User Avatar and Basic Info - Always Visible */}
        <div className="flex items-center space-x-4 p-6 bg-muted/50 rounded-lg border">
          <Avatar className="h-20 w-20 ring-4 ring-muted">
            <AvatarImage src="" />
            <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
              {profile?.name ? getInitials(profile.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              {profile?.name || "User Name"}
            </h3>
            <p className="text-sm font-medium text-primary">
              {profile?.title || "No title set"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">

            {/* Profile Update Form */}
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              {/* Username (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="username">Email:</Label>
                <Input
                  id="username"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name: <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...profileForm.register("name")}
                  placeholder="Enter your full name"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title:</Label>
                <Input
                  id="title"
                  {...profileForm.register("title")}
                  placeholder="Enter your job title"
                />
              </div>

              {/* Mobile with Country */}
              <CountryPhoneInput
                value={profileForm.watch("mobile") || ""}
                onChange={(value) => profileForm.setValue("mobile", value)}
                error={profileForm.formState.errors.mobile?.message}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {profile?.accounts ? (
              <>
                {/* Account Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Account Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Account Name</Label>
                      <p className="text-sm text-muted-foreground">{profile.accounts.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Type</Label>
                      <p className="text-sm text-muted-foreground">{profile.accounts.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.accounts.status)}`}>
                        {profile.accounts.status}
                      </span>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email Domain</Label>
                      <p className="text-sm text-muted-foreground">{profile.accounts.emaildomain}</p>
                    </div>
                  </div>

                  {/* Account Name Update Form */}
                  <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-3">
                    <Label htmlFor="accountName">Update Account Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accountName"
                        {...accountForm.register("accountName")}
                        placeholder="Enter new account name"
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={isUpdatingAccount}
                      >
                        {isUpdatingAccount ? "Updating..." : "Update"}
                      </Button>
                    </div>
                    {accountForm.formState.errors.accountName && (
                      <p className="text-sm text-destructive">
                        {accountForm.formState.errors.accountName.message}
                      </p>
                    )}
                  </form>
                </div>

                {/* Account Users */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Account Members ({accountUsers.length})</h4>
                  {loadingUsers ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {accountUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.name ? getInitials(user.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.name || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{user.title || "No title"}</p>
                          </div>
                        </div>
                      ))}
                      {accountUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No other users in this account
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No account information available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
