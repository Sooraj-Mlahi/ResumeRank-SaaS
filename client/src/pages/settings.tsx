import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Database, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [clearLoading, setClearLoading] = useState(false);

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/analyses/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to clear history");
      return response.json();
    },
    onSuccess: () => {
      setClearLoading(false);
      alert("Analysis history cleared successfully");
    },
    onError: (error) => {
      setClearLoading(false);
      alert("Failed to clear history: " + (error as any).message);
    },
  });

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all analysis history? This cannot be undone.")) {
      setClearLoading(true);
      clearHistoryMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground text-base">Manage your application preferences</p>
      </div>

      <div className="space-y-6">
        <Card className="hover-elevate transition-all">
          <CardHeader>
            <CardTitle>Theme Preferences</CardTitle>
            <CardDescription>Choose your preferred color scheme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "light" ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-medium capitalize">{theme} Theme</p>
                  <p className="text-sm text-muted-foreground">Currently using {theme} theme</p>
                </div>
              </div>
              <Button variant="outline" onClick={toggleTheme} data-testid="button-toggle-theme">
                Switch to {theme === "light" ? "Dark" : "Light"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your analysis history and data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Clear Analysis History</p>
                    <p className="text-sm text-muted-foreground">Delete all past ranking analyses and scores</p>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearHistory}
                disabled={clearLoading}
                className="w-full sm:w-auto"
                data-testid="button-clear-history"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {clearLoading ? "Clearing..." : "Clear History"}
              </Button>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ This action cannot be undone. All analysis results will be permanently deleted.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Password and security options</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account is secured with OAuth authentication. To change your password, please use the password recovery option on the login page or contact your email provider.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
