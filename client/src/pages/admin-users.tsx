import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  isAdmin: number;
  createdAt: string;
  resumeCount: number;
  analysisCount: number;
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details: any;
  createdAt: string;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: activities } = useQuery<UserActivity[]>({
    queryKey: ["/api/admin/users", selectedUserId, "activity"],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${selectedUserId}/activity`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  const filteredUsers = users?.filter(u => 
    u.email.includes(searchTerm) || 
    u.name?.includes(searchTerm)
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers?.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Provider</th>
                    <th className="text-center py-2 px-4">Resumes</th>
                    <th className="text-center py-2 px-4">Analyses</th>
                    <th className="text-left py-2 px-4">Joined</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers?.map(user => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.name || "—"}</td>
                      <td className="py-3 px-4 capitalize">{user.provider}</td>
                      <td className="text-center py-3 px-4">{user.resumeCount}</td>
                      <td className="text-center py-3 px-4">{user.analysisCount}</td>
                      <td className="py-3 px-4">{format(new Date(user.createdAt), "MMM d, yyyy")}</td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          View Activity
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Activity</DialogTitle>
            </DialogHeader>
            
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold capitalize">{activity.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    {activity.details && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No activity found</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
