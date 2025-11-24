import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Moon, Sun, LogOut, Settings, User } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: {
    name?: string;
    email: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1" data-testid="link-home">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold" data-testid="text-brand">ResumeRank</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-2">
              <Link href="/" data-testid="link-dashboard">
                <Button
                  variant={isActive("/") ? "secondary" : "ghost"}
                  className={isActive("/") ? "toggle-elevate toggle-elevated" : ""}
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/fetch" data-testid="link-fetch">
                <Button
                  variant={isActive("/fetch") ? "secondary" : "ghost"}
                  className={isActive("/fetch") ? "toggle-elevate toggle-elevated" : ""}
                >
                  Fetch CVs
                </Button>
              </Link>
              <Link href="/rank" data-testid="link-rank">
                <Button
                  variant={isActive("/rank") ? "secondary" : "ghost"}
                  className={isActive("/rank") ? "toggle-elevate toggle-elevated" : ""}
                >
                  Rank Resumes
                </Button>
              </Link>
              <Link href="/results" data-testid="link-results">
                <Button
                  variant={isActive("/results") ? "secondary" : "ghost"}
                  className={isActive("/results") ? "toggle-elevate toggle-elevated" : ""}
                >
                  Results
                </Button>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
            className="hover-elevate active-elevate-2"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover-elevate" data-testid="button-user-menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt={user.name || user.email} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium" data-testid="text-user-name">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-email">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile" asChild>
                  <DropdownMenuItem data-testid="button-profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings" asChild>
                  <DropdownMenuItem data-testid="button-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                {user?.isAdmin === 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin" asChild>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/users" asChild>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Manage Users
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/resumes" asChild>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Browse Resumes
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
