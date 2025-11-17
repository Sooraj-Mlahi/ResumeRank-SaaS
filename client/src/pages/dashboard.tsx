import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mail, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface DashboardStats {
  totalResumes: number;
  lastAnalysisDate: string | null;
  highestScore: number | null;
  recentActivity: Array<{
    id: string;
    type: "fetch" | "analysis";
    description: string;
    date: string;
  }>;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground text-base" data-testid="text-page-description">
          Welcome back! Here's an overview of your resume screening activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover-elevate transition-all" data-testid="card-total-resumes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total CVs Fetched
            </CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-resumes">
              {stats?.totalResumes || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resumes in your database
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all" data-testid="card-last-analysis">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Analysis
            </CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-last-analysis">
              {stats?.lastAnalysisDate
                ? format(new Date(stats.lastAnalysisDate), "MMM d")
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Most recent ranking
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all" data-testid="card-highest-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Highest Score
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-highest-score">
              {stats && stats.highestScore !== null ? `${stats.highestScore}/100` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Best candidate match
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-fetch-action">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Fetch New CVs
            </CardTitle>
            <CardDescription>
              Connect to your email inbox and import resume attachments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically extract CVs from Gmail or Outlook emails. We'll search for PDF, DOC, and DOCX attachments.
            </p>
            <Link href="/fetch">
              <Button className="w-full justify-between" data-testid="button-goto-fetch">
                Go to Fetch CVs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card data-testid="card-rank-action">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Rank Resumes
            </CardTitle>
            <CardDescription>
              Use AI to score and rank candidates for your job opening
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Provide a job description and let AI analyze all resumes, scoring them from 0-100 with detailed insights.
            </p>
            <Link href="/rank">
              <Button className="w-full justify-between" data-testid="button-goto-rank">
                Go to Rank Resumes
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card className="mt-8" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="bg-muted p-2 rounded-md">
                    {activity.type === "fetch" ? (
                      <Mail className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.date), "PPp")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
