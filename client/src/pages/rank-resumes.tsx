import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, TrendingUp, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Resume {
  id: string;
  candidateName: string;
  originalFileName: string;
}

export default function RankResumes() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [jobPrompt, setJobPrompt] = useState("");
  const [selectedResumeIds, setSelectedResumeIds] = useState<Set<string>>(new Set());

  const { data: resumeCount } = useQuery<{ count: number }>({
    queryKey: ["/api/resumes/count"],
  });

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ["/api/resumes/list"],
  });

  const rankMutation = useMutation({
    mutationFn: (data: { jobPrompt: string; resumeIds?: string[] }) =>
      apiRequest("POST", "/api/resumes/rank", {
        jobPrompt: data.jobPrompt,
        resumeIds: data.resumeIds && data.resumeIds.length > 0 ? data.resumeIds : undefined,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Analysis Complete",
        description: `Ranked ${data.totalResumes} resume(s) successfully`,
      });
      setLocation("/results");
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to rank resumes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleResume = (resumeId: string) => {
    const newSelected = new Set(selectedResumeIds);
    if (newSelected.has(resumeId)) {
      newSelected.delete(resumeId);
    } else {
      newSelected.add(resumeId);
    }
    setSelectedResumeIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResumeIds.size === resumes.length) {
      setSelectedResumeIds(new Set());
    } else {
      setSelectedResumeIds(new Set(resumes.map(r => r.id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobPrompt.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please enter a job description to analyze resumes",
        variant: "destructive",
      });
      return;
    }
    rankMutation.mutate({
      jobPrompt,
      resumeIds: selectedResumeIds.size > 0 ? Array.from(selectedResumeIds) : undefined,
    });
  };

  const hasResumes = (resumeCount?.count ?? 0) > 0;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Rank Resumes</h1>
        <p className="text-muted-foreground text-base" data-testid="text-page-description">
          Provide a job description and let AI analyze and rank all resumes.
        </p>
      </div>

      {!hasResumes && (
        <Alert className="mb-6" data-testid="alert-no-resumes">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Resumes Available</AlertTitle>
          <AlertDescription>
            You need to fetch CVs from your email before you can rank them. Visit the Fetch CVs page to get started.
          </AlertDescription>
        </Alert>
      )}

      <Card data-testid="card-rank-form">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Job Description
          </CardTitle>
          <CardDescription>
            Describe the role, requirements, and ideal candidate profile. The AI will use this to score each resume from 0-100.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="jobPrompt" className="text-base font-semibold">
                Enter Job Requirements
              </Label>
              <Textarea
                id="jobPrompt"
                value={jobPrompt}
                onChange={(e) => setJobPrompt(e.target.value)}
                placeholder="Example:

We're looking for a Senior Full-Stack Engineer with:
- 5+ years of experience with React and Node.js
- Strong background in TypeScript and modern web technologies
- Experience with cloud platforms (AWS, GCP, or Azure)
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or related field preferred

The ideal candidate should have a proven track record of building scalable web applications and working in agile teams."
                className="min-h-64 resize-none font-mono text-sm"
                data-testid="textarea-job-prompt"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Be specific about skills, experience, and qualifications
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-char-count">
                  {jobPrompt.length} characters
                </p>
              </div>
            </div>

            {resumes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Select Resumes to Analyze</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {selectedResumeIds.size === resumes.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <ScrollArea className="border rounded-md p-4 h-48">
                  <div className="space-y-2 pr-4">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={resume.id}
                          checked={selectedResumeIds.has(resume.id)}
                          onCheckedChange={() => handleToggleResume(resume.id)}
                        />
                        <Label
                          htmlFor={resume.id}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {resume.candidateName || "Unknown Candidate"} - {resume.originalFileName}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedResumeIds.size === 0 ? "No resumes selected - all will be analyzed" : `${selectedResumeIds.size} resume(s) selected`}
                </p>
              </div>
            )}

            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                Analysis Info
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>AI will score each resume from 0-100 based on job fit</li>
                <li>Identifies key strengths and weaknesses for each candidate</li>
                <li>Ranks all resumes from best to worst match</li>
                <li>
                  Currently analyzing:{" "}
                  <span className="font-semibold text-foreground" data-testid="text-resume-count">
                    {resumeCount?.count ?? 0}
                  </span>{" "}
                  resume(s)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-base"
              disabled={rankMutation.isPending || !hasResumes || !jobPrompt.trim()}
              data-testid="button-analyze"
            >
              {rankMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Resumes...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Analyze & Rank Resumes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-md">
        <h3 className="font-semibold mb-2 text-sm">Tips for Best Results:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 ml-5 list-disc">
          <li>Include specific technical skills and tools required</li>
          <li>Mention years of experience expectations</li>
          <li>Describe the role's responsibilities and challenges</li>
          <li>Note any preferred education or certifications</li>
          <li>Be clear about must-have vs. nice-to-have qualifications</li>
        </ul>
      </div>
    </div>
  );
}
