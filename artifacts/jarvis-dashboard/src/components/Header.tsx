import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Menu, Bell, Search, Wifi, Battery, Clock } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  "/": "Dashboard Overview",
  "/chat": "AI Chat Interface",
  "/tasks": "Task Manager",
  "/systems": "System Monitor",
  "/settings": "Settings",
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const [time, setTime] = useState(new Date());
  const [notifications] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const title = pageTitles[location] || "Jarvis-OS";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-wide">{title}</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-mono">
            Jarvis-OS · Secure Connection Active
          </p>
        </div>
      </div>

      {/* Center search */}
      <div className="hidden md:flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-1.5 w-64">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search commands..."
          className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full font-mono"
        />
        <kbd className="text-[9px] text-muted-foreground border border-border rounded px-1 font-mono">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Status indicators */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-green-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">CONNECTED</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Battery className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">87%</span>
          </div>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-mono tabular-nums">
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative text-muted-foreground hover:text-primary transition-colors">
          <Bell className="w-4.5 h-4.5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full border-2 border-primary/50 bg-primary/10 flex items-center justify-center glow-ring cursor-pointer">
          <span className="text-primary text-xs font-bold">J</span>
        </div>
      </div>
    </header>
  );
}
