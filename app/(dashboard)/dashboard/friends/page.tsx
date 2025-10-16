import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function FriendsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Friends</h1>
          <p className="text-muted-foreground">
            My number of friends
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Business Friend
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">68</div>
            <p className="text-muted-foreground text-xs">2 Pending requests</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Friends</CardTitle>
          <CardDescription>
            Your network of business connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Your business friends list will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

