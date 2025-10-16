"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  mobile: z.string().min(1, "Mobile number is required"),
  country: z.string().min(1, "Country is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const countries = [
  "Norway",
  "Denmark",
  "Sweden",
  "Finland",
  "United Kingdom",
  "Germany",
  "Netherlands",
  "France",
  "Spain",
  "Italy",
  "United States",
  "Canada",
  "Australia",
  "Singapore",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Brazil",
  "Other",
];

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      title: "",
      mobile: "",
      country: "",
    },
  });

  const countryValue = watch("country");

  // Reset form when profile data changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        title: profile.title || "",
        mobile: profile.mobile || "",
        country: profile.country || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateProfile(data);

      if (result.success) {
        toast({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="username">Username:</Label>
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
              {...register("name")}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title:</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter your job title"
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label htmlFor="mobile">
              Mobile: <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select
                value={countryValue}
                onValueChange={(value) => setValue("country", value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="mobile"
                {...register("mobile")}
                placeholder="Phone number"
                className="flex-1"
              />
            </div>
            {errors.mobile && (
              <p className="text-sm text-red-500">{errors.mobile.message}</p>
            )}
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
            )}
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
