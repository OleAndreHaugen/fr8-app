"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { 
  createAccountForUser, 
  extractEmailDomain
} from "@/lib/account-utils";
import { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["Owner", "Broker", "Admin", "Charterer"], {
    required_error: "Please select an account type",
  }),
});

type CreateAccountInput = z.infer<typeof createAccountSchema>;

interface AccountAssignmentDialogProps {
  userEmail: string;
  onComplete: () => void;
}

export function AccountAssignmentDialog({ userEmail, onComplete }: AccountAssignmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const createForm = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
  });

  const onCreateAccount = async (data: CreateAccountInput) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const emaildomain = extractEmailDomain(userEmail);
      
      await createAccountForUser(
        user.id,
        data.name,
        data.type,
        emaildomain
      );

      toast({
        variant: "success",
        title: "Account Created",
        description: "Your account has been created and you've been assigned to it.",
      });

      onComplete();
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Account Assignment Required</DialogTitle>
          <DialogDescription>
            You need to be assigned to an account to access the dashboard. 
            Your email domain is: <strong>{extractEmailDomain(userEmail)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create Account Form */}
          <form onSubmit={createForm.handleSubmit(onCreateAccount)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account/Company Name</Label>
              <Input
                id="name"
                placeholder="Enter company name"
                {...createForm.register("name")}
                disabled={isLoading}
              />
              {createForm.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select
                onValueChange={(value) => createForm.setValue("type", value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Broker">Broker</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Charterer">Charterer</SelectItem>
                </SelectContent>
              </Select>
              {createForm.formState.errors.type && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.type.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
