import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, XCircle, Loader2, Download, Calendar, Building2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmailConnection {
  id: string;
  provider: "gmail" | "outlook";
  isActive: boolean;
  lastFetchedAt: string | null;
}

interface FetchHistory {
  id: string;
  provider: string;
  resumesFound: number;
  fetchedAt: string;
}

export default function FetchCVs() {
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);

  const { data: connections, isLoading: connectionsLoading } = useQuery<EmailConnection[]>({
    queryKey: ["/api/email/connections"],
  });

  const { data: history, isLoading: historyLoading } = useQuery<FetchHistory[]>({
    queryKey: ["/api/email/fetch-history"],
  });

  const connectGmailMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/email/connect/gmail", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/connections"] });
      toast({
        title: "Gmail Connected",
        description: "Successfully connected to your Gmail account",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
    },
  });

  const fetchGmailMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/email/fetch/gmail", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/fetch-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "CVs Fetched Successfully",
        description: `Found ${data.count} resume(s) from Gmail`,
      });
      setIsFetching(false);
    },
    onError: () => {
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch CVs from Gmail. Please try again.",
        variant: "destructive",
      });
      setIsFetching(false);
    },
  });

  const handleFetchGmail = async () => {
    setIsFetching(true);
    fetchGmailMutation.mutate();
  };

  const gmailConnection = connections?.find((c) => c.provider === "gmail");
  const outlookConnection = connections?.find((c) => c.provider === "outlook");

  if (connectionsLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Fetch CVs from Email</h1>
        <p className="text-muted-foreground text-base" data-testid="text-page-description">
          Connect your email provider and import resume attachments automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card data-testid="card-gmail-connection">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <SiGoogle className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Gmail</CardTitle>
                  <CardDescription className="mt-1">Google email service</CardDescription>
                </div>
              </div>
              {gmailConnection?.isActive ? (
                <Badge variant="default" className="gap-1" data-testid="badge-gmail-connected">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1" data-testid="badge-gmail-disconnected">
                  <XCircle className="w-3 h-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {gmailConnection?.isActive ? (
              <>
                {gmailConnection.lastFetchedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Last fetched: {format(new Date(gmailConnection.lastFetchedAt), "PPp")}
                  </div>
                )}
                <Button
                  onClick={handleFetchGmail}
                  disabled={isFetching}
                  className="w-full"
                  data-testid="button-fetch-gmail"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching CVs...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Fetch CVs from Gmail
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => connectGmailMutation.mutate()}
                disabled={connectGmailMutation.isPending}
                className="w-full"
                data-testid="button-connect-gmail"
              >
                {connectGmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Gmail Account
                  </>
                )}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              We'll search for emails with resume attachments (PDF, DOC, DOCX)
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-outlook-connection">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Outlook</CardTitle>
                  <CardDescription className="mt-1">Microsoft email service</CardDescription>
                </div>
              </div>
              {outlookConnection?.isActive ? (
                <Badge variant="default" className="gap-1" data-testid="badge-outlook-connected">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1" data-testid="badge-outlook-disconnected">
                  <XCircle className="w-3 h-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                Microsoft Outlook integration requires manual API key setup. Contact support for configuration instructions.
              </p>
            </div>
            <Button variant="secondary" disabled className="w-full" data-testid="button-outlook-disabled">
              Coming Soon
            </Button>
            <p className="text-xs text-muted-foreground">
              Manual configuration available with Microsoft Graph API credentials
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-fetch-history">
        <CardHeader>
          <CardTitle>Fetch History</CardTitle>
          <CardDescription>Your recent CV import activities</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Resumes Found</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} data-testid={`history-row-${item.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.provider === "gmail" ? (
                            <SiGoogle className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                          {item.provider.charAt(0).toUpperCase() + item.provider.slice(1)}
                        </div>
                      </TableCell>
                      <TableCell>{item.resumesFound}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.fetchedAt), "PPp")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No fetch history yet. Connect an email provider and start importing CVs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
