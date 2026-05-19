import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, List, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col bg-background pb-[80px]">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="font-bold text-xl tracking-tight text-primary">LM Rider</div>
          <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[80px] items-center border-t bg-card px-4 pb-safe">
        <Link href="/jobs" className={`flex flex-1 flex-col items-center justify-center space-y-1 ${location === "/jobs" ? "text-primary" : "text-muted-foreground"}`} data-testid="link-nav-jobs">
          <List className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase">Available</span>
        </Link>
        <Link href="/my-jobs" className={`flex flex-1 flex-col items-center justify-center space-y-1 ${location === "/my-jobs" ? "text-primary" : "text-muted-foreground"}`} data-testid="link-nav-my-jobs">
          <ClipboardList className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase">My Jobs</span>
        </Link>
      </nav>
    </div>
  );
}
