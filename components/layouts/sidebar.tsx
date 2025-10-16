"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Calculator,
  Package,
  TrendingUp,
  Fuel,
  Route,
  Users,
  BookOpen,
  Award,
  Box,
  Settings,
  BarChart3,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    name: "My Calculations",
    href: "/dashboard/calculations",
    icon: Calculator,
  },
  {
    name: "FR8 Freight",
    href: "/dashboard/freight",
    icon: Package,
  },
  {
    name: "Live Offers",
    href: "/dashboard/offers",
    icon: TrendingUp,
  },
  {
    name: "Fuel",
    href: "/dashboard/fuel",
    icon: Fuel,
  },
  {
    name: "FFA/Routes",
    href: "/dashboard/routes",
    icon: Route,
  },
  {
    name: "Friends",
    href: "/dashboard/friends",
    icon: Users,
  },
  {
    name: "Recap",
    href: "/dashboard/recap",
    icon: BookOpen,
  },
  {
    name: "Badges",
    href: "/dashboard/badges",
    icon: Award,
  },
  /*
  {
    name: "FOB",
    href: "/dashboard/for8",
    icon: Box,
  },
  {
    name: "Admin",
    href: "/dashboard/admin",
    icon: Settings,
  },
  {
    name: "Analytic",
    href: "/dashboard/analytic",
    icon: BarChart3,
  },
  */
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <Image
            src="/512_blaa.png"
            alt="FR8 Logo"
            width={68}
            height={68}
          />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

