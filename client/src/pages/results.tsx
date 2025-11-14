import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RankedResume {
  id: string;
  rank: number;
  candidateName: string;
  email: string | null;
  phone: string | null;
  score: number;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  extractedText: string;
  originalFileName: string;
  fileData: string;
  fileType: string;
}

interface AnalysisData {
  id: string;
  jobPrompt: string;
  createdAt: string;
  results: RankedResume[];
}

export default function Results() {
  const [selectedResume, setSelectedResume] = useState<RankedResume | null>(null);
  const [sortField, setSortField] = useState<"rank" | "score">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: analysis, isLoading } = useQuery<AnalysisData>({
    queryKey: ["/api/resumes/latest-analysis"],
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const handleSort = (field: "rank" | "score") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleDownload = (resume: RankedResume) => {
    const link = document.createElement("a");
    link.href = `data:application/${resume.fileType};base64,${resume.fileData}`;
    link.download = resume.originalFileName;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!analysis || analysis.results.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Results</h1>
          <p className="text-muted-foreground text-base">
            View ranked resumes and AI analysis results
          </p>
        </div>
        <Alert data-testid="alert-no-results">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Analysis Results</AlertTitle>
          <AlertDescription>
            You haven't run any resume analysis yet. Go to the Rank Resumes page to get started.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sortedResults = [...analysis.results].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;
    if (sortField === "rank") {
      return (a.rank - b.rank) * multiplier;
    }
    return (a.score - b.score) * multiplier;
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Results</h1>
        <p className="text-muted-foreground text-base" data-testid="text-page-description">
          AI-powered resume rankings for your job opening
        </p>
      </div>

      <Card className="mb-6" data-testid="card-job-prompt">
        <CardHeader>
          <CardTitle className="text-lg">Job Description Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm whitespace-pre-wrap font-mono" data-testid="text-job-prompt">
              {analysis.jobPrompt}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Analyzed on {new Date(analysis.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-results-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Ranked Candidates</CardTitle>
              <CardDescription>
                {analysis.results.length} resume(s) analyzed and scored
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              {analysis.results.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("rank")}
                        className="hover-elevate -ml-2"
                        data-testid="button-sort-rank"
                      >
                        Rank
                        {sortField === "rank" && (
                          sortOrder === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="w-32">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("score")}
                        className="hover-elevate -ml-2"
                        data-testid="button-sort-score"
                      >
                        Score
                        {sortField === "score" && (
                          sortOrder === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Key Strengths</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((resume) => (
                    <TableRow
                      key={resume.id}
                      className="hover-elevate"
                      data-testid={`row-resume-${resume.id}`}
                    >
                      <TableCell className="font-bold text-lg" data-testid={`text-rank-${resume.id}`}>
                        #{resume.rank}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold" data-testid={`text-name-${resume.id}`}>
                            {resume.candidateName}
                          </p>
                          {resume.email && (
                            <p className="text-xs text-muted-foreground font-mono" data-testid={`text-email-${resume.id}`}>
                              {resume.email}
                            </p>
                          )}
                          {resume.phone && (
                            <p className="text-xs text-muted-foreground" data-testid={`text-phone-${resume.id}`}>
                              {resume.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getScoreBadgeVariant(resume.score)}
                              className="text-sm px-2"
                              data-testid={`badge-score-${resume.id}`}
                            >
                              {resume.score}/100
                            </Badge>
                          </div>
                          <Progress
                            value={resume.score}
                            className="h-2"
                            data-testid={`progress-score-${resume.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {resume.strengths.slice(0, 2).map((strength, idx) => (
                            <p
                              key={idx}
                              className="text-sm text-muted-foreground truncate max-w-xs"
                              data-testid={`text-strength-${resume.id}-${idx}`}
                            >
                              • {strength}
                            </p>
                          ))}
                          {resume.strengths.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{resume.strengths.length - 2} more
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedResume(resume)}
                            data-testid={`button-view-${resume.id}`}
                            className="hover-elevate"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(resume)}
                            data-testid={`button-download-${resume.id}`}
                            className="hover-elevate"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedResume} onOpenChange={() => setSelectedResume(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl" data-testid="dialog-title">
              {selectedResume?.candidateName}
            </DialogTitle>
            <DialogDescription data-testid="dialog-description">
              Detailed AI analysis and resume content
            </DialogDescription>
          </DialogHeader>
          {selectedResume && (
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="space-y-6 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="dialog-score">
                        {selectedResume.score}/100
                      </div>
                      <Progress value={selectedResume.score} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">Rank</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold" data-testid="dialog-rank">
                        #{selectedResume.rank}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        out of {analysis.results.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedResume.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm" data-testid="dialog-summary">{selectedResume.summary}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedResume.strengths.map((strength, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                          data-testid={`dialog-strength-${idx}`}
                        >
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedResume.weaknesses.map((weakness, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                          data-testid={`dialog-weakness-${idx}`}
                        >
                          <span className="text-red-500 mt-0.5">✗</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Resume Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-xs whitespace-pre-wrap font-mono" data-testid="dialog-extracted-text">
                        {selectedResume.extractedText}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => handleDownload(selectedResume)}
                  className="w-full"
                  data-testid="dialog-download-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original CV
                </Button>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
