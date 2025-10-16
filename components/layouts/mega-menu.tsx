"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  Menu,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and main dashboard",
    category: "Operations",
  },
  {
    name: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
    description: "Communicate with team members",
    category: "Operations",
  },
  {
    name: "My Calculations",
    href: "/dashboard/calculations",
    icon: Calculator,
    description: "Manage your freight calculations",
    category: "Operations",
  },
  {
    name: "FR8 Freight",
    href: "/dashboard/freight",
    icon: Package,
    description: "Freight management and tracking",
    category: "Trading",
  },
  {
    name: "Live Offers",
    href: "/dashboard/offers",
    icon: TrendingUp,
    description: "View and manage live offers",
    category: "Trading",
  },
  {
    name: "Fuel",
    href: "/dashboard/fuel",
    icon: Fuel,
    description: "Fuel prices and calculations",
    category: "Trading",
  },
  {
    name: "FFA/Routes",
    href: "/dashboard/routes",
    icon: Route,
    description: "Forward Freight Agreements and routes",
    category: "Trading",
  },
  {
    name: "Friends",
    href: "/dashboard/friends",
    icon: Users,
    description: "Connect with other users",
    category: "Social",
  },
  {
    name: "Recap",
    href: "/dashboard/recap",
    icon: BookOpen,
    description: "Daily and weekly summaries",
    category: "Social",
  },
  {
    name: "Badges",
    href: "/dashboard/badges",
    icon: Award,
    description: "Achievements and recognition",
    category: "Social",
  },
];

const categories = ["Operations", "Trading", "Social"];

export function MegaMenu() {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-medium",
            navigationItems.some((item) => pathname === item.href)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="h-4 w-4" />
          Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {categories.map((category, categoryIndex) => (
          <div key={category}>
            {categoryIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{category}</DropdownMenuLabel>
            {navigationItems
              .filter((item) => item.category === category)
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-start gap-3 px-2 py-2",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
