import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, User, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  provider: string;
}

export default function Profile() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-2xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-8">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="text-profile-title">Profile</h1>
        <p className="text-muted-foreground text-base">View your account information</p>
      </div>

      <div className="space-y-6">
        <Card className="hover-elevate transition-all">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={user.name || user.email} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Account Name</p>
                <p className="text-lg font-semibold" data-testid="text-user-name">
                  {user.name || "Not Set"}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium" data-testid="text-user-email">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Authentication Provider</p>
                  <p className="font-medium capitalize" data-testid="text-auth-provider">
                    {user.provider === "test" ? "Test Account" : user.provider}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm" data-testid="text-user-id">{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Active account</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
