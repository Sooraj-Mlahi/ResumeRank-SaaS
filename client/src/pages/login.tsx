import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiGoogle } from "react-icons/si";
import { FileText, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleMicrosoftLogin = () => {
    window.location.href = "/api/auth/microsoft";
  };

  const handleTestLogin = async () => {
    try {
      const response = await fetch("/api/auth/test-login");
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Test login failed");
    }
  };

  const passwordMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/password-login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Authentication failed");
      }
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    passwordMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg">
              <FileText className="w-8 h-8" data-testid="icon-logo" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-app-title">ResumeRank</h1>
          <p className="text-muted-foreground text-base" data-testid="text-app-description">
            AI-powered resume screening from your inbox
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl" data-testid="text-card-title">
              {isSignup ? "Create Account" : "Sign in to continue"}
            </CardTitle>
            <CardDescription data-testid="text-card-description">
              {isSignup ? "Sign up with email or continue with OAuth" : "Choose your authentication method"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded text-sm" data-testid="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={passwordMutation.isPending}
                data-testid="button-password-submit"
              >
                {passwordMutation.isPending ? "Loading..." : (isSignup ? "Sign Up" : "Sign In")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-base hover-elevate active-elevate-2"
              data-testid="button-google-login"
            >
              <SiGoogle className="w-5 h-5" />
              Continue with Google
            </Button>
            <Button
              onClick={handleMicrosoftLogin}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-base hover-elevate active-elevate-2"
              data-testid="button-microsoft-login"
            >
              <Mail className="w-5 h-5" />
              Continue with Microsoft
            </Button>

            <Button
              onClick={handleTestLogin}
              variant="secondary"
              className="w-full"
              data-testid="button-test-login"
            >
              Test Login
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                }}
                className="text-sm text-primary hover:underline"
                data-testid="button-toggle-signup"
              >
                {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8" data-testid="text-footer">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
