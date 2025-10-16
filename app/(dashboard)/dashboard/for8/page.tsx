import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function For8Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">FOR8</h1>
        <p className="text-muted-foreground">
          FOR8 specific features and tools
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FOR8</CardTitle>
          <CardDescription>
            FOR8 related functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            FOR8 content will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

