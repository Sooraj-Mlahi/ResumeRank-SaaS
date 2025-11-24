import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";

interface Resume {
  id: string;
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  originalFileName: string;
  source: string;
  fetchedAt: string;
  user: {
    email: string;
    name: string;
  };
}

export default function AdminResumes() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/admin/resumes", searchQuery],
    queryFn: async () => {
      const url = new URL("/api/admin/resumes", window.location.origin);
      if (searchQuery) url.searchParams.set("q", searchQuery);
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Resume Browser</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Resumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search candidate name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={() => setSearchQuery("")}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumes ({resumes?.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Candidate</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Phone</th>
                    <th className="text-left py-2 px-4">File</th>
                    <th className="text-left py-2 px-4">Source</th>
                    <th className="text-left py-2 px-4">From User</th>
                    <th className="text-left py-2 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes?.map(resume => (
                    <tr key={resume.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{resume.candidateName || "Unknown"}</td>
                      <td className="py-3 px-4">{resume.email || "—"}</td>
                      <td className="py-3 px-4">{resume.phone || "—"}</td>
                      <td className="py-3 px-4 text-xs">{resume.originalFileName}</td>
                      <td className="py-3 px-4 capitalize text-xs">{resume.source}</td>
                      <td className="py-3 px-4">{resume.user.email}</td>
                      <td className="py-3 px-4">{format(new Date(resume.fetchedAt), "MMM d, yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
