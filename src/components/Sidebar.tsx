import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Brain,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Cpu, label: "Systems", href: "/systems" },
  { icon: Brain, label: "Voice & Tone", href: "/voice" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={`relative flex flex-col transition-all duration-300 ease-in-out bg-sidebar border-r border-sidebar-border shrink-0 ${
        open ? "w-56" : "w-16"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center glow-ring">
            <Zap className="w-4 h-4 text-primary" />
          </div>
        </div>
        {open && (
          <div className="overflow-hidden">
            <p className="text-primary font-bold text-sm tracking-widest uppercase">Jarvis</p>
            <p className="text-muted-foreground text-[10px] tracking-wider">OS v2.1.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 group ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} />
                {open && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {active && open && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System status at bottom */}
      {open && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="hex-border rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground tracking-wider uppercase">Core Status</span>
              <span className="text-green-400 font-mono">ONLINE</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    backgroundColor: i < 6 ? "hsl(195 100% 50%)" : "hsl(210 30% 22%)",
                    opacity: i < 6 ? 0.7 + i * 0.04 : 0.3,
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">CPU 74% · RAM 6.2GB</p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors z-10"
      >
        {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </aside>
  );
}
