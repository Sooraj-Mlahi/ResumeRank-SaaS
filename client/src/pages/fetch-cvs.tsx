import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, XCircle, Loader2, Download, Calendar, Building2, Upload, FileUp } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [gmailStartDate, setGmailStartDate] = useState<string>("");
  const [gmailEndDate, setGmailEndDate] = useState<string>("");
  const [outlookStartDate, setOutlookStartDate] = useState<string>("");
  const [outlookEndDate, setOutlookEndDate] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: connections, isLoading: connectionsLoading } = useQuery<EmailConnection[]>({
    queryKey: ["/api/email/connections"],
  });

  const { data: history, isLoading: historyLoading } = useQuery<FetchHistory[]>({
    queryKey: ["/api/email/fetch-history"],
  });

  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email/connect/gmail", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to connect to Gmail");
      }

      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      });
    },
  });

  const fetchGmailMutation = useMutation({
    mutationFn: (params: { startDate?: string; endDate?: string }) => 
      apiRequest("POST", "/api/email/fetch/gmail", params),
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

  const connectOutlookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email/connect/outlook", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to connect to Outlook");
      }

      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Outlook. Please try again.",
        variant: "destructive",
      });
    },
  });

  const fetchOutlookMutation = useMutation({
    mutationFn: (params: { startDate?: string; endDate?: string }) =>
      apiRequest("POST", "/api/email/fetch/outlook", params),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/fetch-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "CVs Fetched Successfully",
        description: `Found ${data.count} resume(s) from Outlook`,
      });
      setIsFetching(false);
    },
    onError: () => {
      toast({
        title: "Fetch Failed",
        description: "Failed to fetch CVs from Outlook. Please try again.",
        variant: "destructive",
      });
      setIsFetching(false);
    },
  });

  const handleFetchGmail = async () => {
    setIsFetching(true);
    fetchGmailMutation.mutate({ 
      startDate: gmailStartDate || undefined, 
      endDate: gmailEndDate || undefined 
    });
  };

  const handleFetchOutlook = async () => {
    setIsFetching(true);
    fetchOutlookMutation.mutate({ 
      startDate: outlookStartDate || undefined, 
      endDate: outlookEndDate || undefined 
    });
  };

  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resumes');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email/fetch-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Upload Successful",
        description: `${data.count} resume(s) uploaded successfully`,
      });
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload resumes. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      uploadFilesMutation.mutate(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || 
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (files.length > 0) {
      setIsUploading(true);
      uploadFilesMutation.mutate(files);
    } else {
      toast({
        title: "Invalid Files",
        description: "Please upload only PDF or DOCX files",
        variant: "destructive",
      });
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
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
          Connect your email provider and import resume attachments automatically. You can also upload CVs directly!
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
                <div className="space-y-3 py-2 border-t border-b">
                  <div className="text-sm font-medium">Filter by Date (Optional)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="gmail-start-date" className="text-xs">Start Date</Label>
                      <Input
                        id="gmail-start-date"
                        type="date"
                        value={gmailStartDate}
                        onChange={(e) => setGmailStartDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gmail-end-date" className="text-xs">End Date</Label>
                      <Input
                        id="gmail-end-date"
                        type="date"
                        value={gmailEndDate}
                        onChange={(e) => setGmailEndDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
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
            {outlookConnection?.isActive ? (
              <>
                {outlookConnection.lastFetchedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Last fetched: {format(new Date(outlookConnection.lastFetchedAt), "PPp")}
                  </div>
                )}
                <div className="space-y-3 py-2 border-t border-b">
                  <div className="text-sm font-medium">Filter by Date (Optional)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="outlook-start-date" className="text-xs">Start Date</Label>
                      <Input
                        id="outlook-start-date"
                        type="date"
                        value={outlookStartDate}
                        onChange={(e) => setOutlookStartDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outlook-end-date" className="text-xs">End Date</Label>
                      <Input
                        id="outlook-end-date"
                        type="date"
                        value={outlookEndDate}
                        onChange={(e) => setOutlookEndDate(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleFetchOutlook}
                  disabled={isFetching}
                  className="w-full"
                  data-testid="button-fetch-outlook"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fetching CVs...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Fetch CVs from Outlook
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => connectOutlookMutation.mutate()}
                disabled={connectOutlookMutation.isPending}
                className="w-full"
                data-testid="button-connect-outlook"
              >
                {connectOutlookMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Outlook Account
                  </>
                )}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              We'll search for emails with resume attachments (PDF, DOC, DOCX)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Upload Resumes</CardTitle>
              <CardDescription>Drag and drop or browse to upload PDF/DOCX files</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? 'Drop files here' : 'Upload Resume Files'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your PDF or DOCX files here, or click to browse
            </p>
            <Button
              onClick={handleBrowseClick}
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Browse Files
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOCX • Max 10 files at once
            </p>
          </div>
        </CardContent>
      </Card>

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
