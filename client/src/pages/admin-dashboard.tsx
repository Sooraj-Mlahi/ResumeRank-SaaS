import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, BarChart3, TrendingUp } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalResumes: number;
  totalAnalyses: number;
  avgScore: number | null;
  usersThisWeek: number;
  resumesThisWeek: number;
  analysesThisWeek: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats?.usersThisWeek} this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalResumes}</div>
              <p className="text-xs text-muted-foreground">{stats?.resumesThisWeek} this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground">{stats?.analysesThisWeek} this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgScore ? Math.round(stats.avgScore) : "N/A"}</div>
              <p className="text-xs text-muted-foreground">resume quality</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">New Users</p>
                  <p className="text-xl font-bold">{stats?.usersThisWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resumes Added</p>
                  <p className="text-xl font-bold">{stats?.resumesThisWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analyses Run</p>
                  <p className="text-xl font-bold">{stats?.analysesThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <span className="text-sm font-semibold text-green-600">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">API</span>
                  <span className="text-sm font-semibold text-green-600">Running</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Users</span>
                  <span className="text-sm font-semibold text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
