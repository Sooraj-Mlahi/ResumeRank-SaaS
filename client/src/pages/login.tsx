import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiGoogle } from "react-icons/si";
import { FileText, Mail } from "lucide-react";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleMicrosoftLogin = () => {
    window.location.href = "/api/auth/microsoft";
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
            <CardTitle className="text-2xl" data-testid="text-card-title">Sign in to continue</CardTitle>
            <CardDescription data-testid="text-card-description">
              Choose your email provider to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground" data-testid="text-privacy-note">
                We'll never access your emails without permission
              </p>
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
