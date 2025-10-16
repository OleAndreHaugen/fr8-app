import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, MapPin, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <Package className="h-6 w-6 text-primary" />
            <span>FR8</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Modern Freight Management
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Streamline your logistics operations with our comprehensive freight
            portal. Track shipments, manage carriers, and optimize your supply
            chain.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-primary/10 p-3">
                  <TruckIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">
                  Shipment Management
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create, track, and manage shipments across multiple carriers
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-primary/10 p-3">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Real-time Tracking</h3>
                <p className="text-muted-foreground text-sm">
                  Monitor your shipments in real-time with automatic updates
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-primary/10 p-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Analytics</h3>
                <p className="text-muted-foreground text-sm">
                  Gain insights with comprehensive reporting and analytics
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-lg bg-primary/10 p-3">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">Inventory Control</h3>
                <p className="text-muted-foreground text-sm">
                  Manage inventory across warehouses and locations
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}

