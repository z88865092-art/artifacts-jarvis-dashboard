import { Link } from "wouter";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-full border-2 border-destructive/50 bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="text-center">
        <p className="text-6xl font-bold font-mono text-primary mb-2">404</p>
        <h1 className="text-lg font-semibold text-foreground">Module Not Found</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">The requested system module does not exist.</p>
      </div>
      <Link href="/">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-ring">
          <Home className="w-4 h-4" />
          Return to Dashboard
        </button>
      </Link>
    </div>
  );
}
