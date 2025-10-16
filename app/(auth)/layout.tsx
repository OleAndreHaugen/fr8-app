import { Package } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
          <Package className="h-8 w-8 text-primary" />
          <span>FR8 Portal</span>
        </Link>
      </div>
      {children}
    </div>
  );
}

