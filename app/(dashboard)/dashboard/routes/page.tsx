import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">FFA/Routes</h1>
        <p className="text-muted-foreground">
          Average FFA prices in USD
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forward Freight Agreements</CardTitle>
          <CardDescription>
            FFA pricing and routes data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            FFA/Routes data will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

