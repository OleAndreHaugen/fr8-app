import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BadgesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Badges</h1>
        <p className="text-muted-foreground">
          My learning points
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">255</div>
            <p className="text-muted-foreground text-xs">385 Points achievable</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Badges</CardTitle>
          <CardDescription>
            Achievements and learning milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Your badges and achievements will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

