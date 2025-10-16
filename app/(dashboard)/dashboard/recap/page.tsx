import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RecapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Recap</h1>
        <p className="text-muted-foreground">
          Summary and overview of activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Recap</CardTitle>
          <CardDescription>
            Your recent activities and summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Recap information will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

