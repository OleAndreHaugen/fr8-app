import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layouts/header";
import { AccountAssignmentWrapper } from "@/components/account-assignment-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header user={user} />
      <main className="flex-1 overflow-hidden bg-secondary/50">
        <AccountAssignmentWrapper user={user}>
          {children}
        </AccountAssignmentWrapper>
      </main>
    </div>
  );
}

