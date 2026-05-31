import {
  Activity, Cpu, HardDrive, TrendingUp, TrendingDown,
  CheckCircle, Clock, AlertTriangle, Globe, Shield,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useGetSystemStats } from "@/lib/api-client";
import { useEffect, useRef, useState } from "react";

const MAX_HISTORY = 20;

function useRollingBuffer<T>(value: T | undefined): T[] {
  const buf = useRef<T[]>([]);
  useEffect(() => {
    if (value === undefined) return;
    buf.current = [...buf.current.slice(-(MAX_HISTORY - 1)), value];
  }, [value]);
  return buf.current;
}

const StatCard = ({
  icon: Icon, label, value, unit, sub, trend, color = "primary",
}: {
  icon: React.ElementType; label: string; value: string; unit?: string;
  sub?: string; trend?: "up" | "down"; color?: string;
}) => (
  <div className="hex-border rounded-xl p-4 bg-card flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] tracking-widest uppercase text-muted-foreground font-mono">{label}</span>
      <div className="w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: `hsl(var(--${color}) / 0.15)`, color: `hsl(var(--${color}))` }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
    <div className="flex items-end gap-1.5">
      <span className="text-2xl font-bold text-foreground tabular-nums font-mono">{value}</span>
      {unit && <span className="text-muted-foreground text-sm mb-0.5">{unit}</span>}
      {trend && (
        <div className={`ml-auto flex items-center gap-0.5 text-[10px] font-mono ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
      )}
    </div>
    {sub && <p className="text-[11px] text-muted-foreground font-mono">{sub}</p>}
  </div>
);

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted/40 ${className ?? ""}`} />
);

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetSystemStats();

  useEffect(() => {
    const id = setInterval(() => { refetch(); }, 3000);
    return () => clearInterval(id);
  }, [refetch]);

  const [cpuHistory, setCpuHistory] = useState<{ t: number; v: number }[]>([]);
  const [netHistory, setNetHistory] = useState<{ t: number; up: number; down: number }[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!data) return;
    const t = tickRef.current++;
    setCpuHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), { t, v: data.cpu ?? 0 }]);
    setNetHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), { t, up: data.network?.upload ?? 0, down: data.network?.download ?? 0 }]);
  }, [data]);

  if (isError) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400 font-mono">Failed to reach API - is the server running?</p>
    </div>
  );

  const tasks    = data?.tasks    ?? [];
  const alerts   = data?.alerts   ?? [];
  const services = data?.services ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="hex-border rounded-xl p-4 bg-card flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        )) : <>
          <StatCard icon={Cpu}       label="CPU Usage"       value={`${(data?.cpu ?? 0).toFixed(0)}`}          unit="%" sub="8 cores active" trend="up" />
          <StatCard icon={HardDrive} label="RAM Used"        value={`${(data?.ram?.percent ?? 0).toFixed(0)}`} unit="%" sub={`${data?.ram?.used ?? 0} / ${data?.ram?.total ?? 0} GB`} trend="up" color="chart-4" />
          <StatCard icon={Globe}     label="Network I/O"     value={`${data?.network?.download ?? 0}`}         unit="MB/s" sub={`Up ${data?.network?.upload ?? 0} Down ${data?.network?.download ?? 0}`} color="chart-2" />
          <StatCard icon={Shield}    label="Threats Blocked" value={`${data?.threatsBlocked ?? 0}`}            sub="Last 24 hours" trend="down" color="destructive" />
        </>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hex-border rounded-xl bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">CPU Activity</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-mono">LIVE</span>
            </div>
          </div>
          <div className="h-32">
            {cpuHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuHistory}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(195 100% 50%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(195 100% 50%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <Tooltip
                    contentStyle={{ background: "hsl(222 40% 9%)", border: "1px solid hsl(195 100% 50% / 0.3)", borderRadius: "6px", fontSize: "11px", color: "hsl(195 100% 88%)" }}
                    formatter={(v: number) => [`${(v ?? 0).toFixed(1)}%`, "CPU"]}
                    labelFormatter={() => ""}
                  />
                  <Area type="monotone" dataKey="v" stroke="hsl(195 100% 50%)" strokeWidth={1.5} fill="url(#cpuGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full" />}
          </div>
        </div>

        <div className="hex-border rounded-xl bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Network Traffic</h3>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-primary">Download</span>
              <span className="text-chart-2">Upload</span>
            </div>
          </div>
          <div className="h-32">
            {netHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netHistory}>
                  <defs>
                    <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(195 100% 50%)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(195 100% 50%)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(160 80% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160 80% 45%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <Tooltip
                    contentStyle={{ background: "hsl(222 40% 9%)", border: "1px solid hsl(195 100% 50% / 0.3)", borderRadius: "6px", fontSize: "11px", color: "hsl(195 100% 88%)" }}
                  />
                  <Area type="monotone" dataKey="down" stroke="hsl(195 100% 50%)" strokeWidth={1.5} fill="url(#downGrad)" dot={false} />
                  <Area type="monotone" dataKey="up"   stroke="hsl(160 80% 45%)" strokeWidth={1.5} fill="url(#upGrad)"   dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hex-border rounded-xl bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Active Tasks</h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              {tasks.filter(t => t.status === "done").length}/{tasks.length} done
            </span>
          </div>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))
              : tasks.map(task => (
                  <div key={task.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {task.status === "done"
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          : <Clock className="w-3.5 h-3.5 text-primary shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
                        }
                        <span className="text-foreground font-medium truncate">{task.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: task.priority === "critical" ? "hsl(0 84% 60% / 0.2)" : task.priority === "high" ? "hsl(35 90% 55% / 0.2)" : "hsl(195 100% 50% / 0.1)",
                            color: task.priority === "critical" ? "hsl(0 84% 70%)" : task.priority === "high" ? "hsl(35 90% 65%)" : "hsl(195 100% 60%)",
                          }}>
                          {task.priority}
                        </span>
                        <span className="text-muted-foreground font-mono tabular-nums">{task.progress ?? 0}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${task.progress ?? 0}%`,
                          background: task.status === "done" ? "hsl(160 80% 45%)" : task.priority === "critical" ? "hsl(0 84% 60%)" : "hsl(195 100% 50%)",
                          boxShadow: task.status !== "done" ? "0 0 6px hsl(195 100% 50% / 0.5)" : undefined,
                        }}
                      />
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        <div className="hex-border rounded-xl bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">System Alerts</h3>
            <span className="text-[10px] font-mono text-primary px-2 py-0.5 rounded border border-primary/30 bg-primary/10">
              {alerts.length} ACTIVE
            </span>
          </div>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                ))
              : alerts.map((alert, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border"
                    style={{
                      background: alert.type === "warn" ? "hsl(35 90% 55% / 0.08)" : alert.type === "success" ? "hsl(160 80% 45% / 0.08)" : "hsl(195 100% 50% / 0.06)",
                      borderColor: alert.type === "warn" ? "hsl(35 90% 55% / 0.3)" : alert.type === "success" ? "hsl(160 80% 45% / 0.3)" : "hsl(195 100% 50% / 0.25)",
                    }}>
                    {alert.type === "warn"
                      ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(35 90% 65%)" }} />
                      : alert.type === "success"
                      ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
                      : <Activity className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{alert.msg}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{alert.time}</p>
                    </div>
                  </div>
                ))
            }
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center space-y-1">
                    <Skeleton className="h-4 w-12 mx-auto" />
                    <Skeleton className="h-2.5 w-10 mx-auto" />
                  </div>
                ))
              : [
                  { label: "Uptime",  value: `${data?.uptime ?? 0}%`,   color: "text-green-400" },
                  { label: "Latency", value: `${data?.latency ?? 0}ms`, color: "text-primary" },
                  { label: "Errors",  value: "0.02%",                    color: "text-yellow-400" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider">{s.label}</p>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      <div className="hex-border rounded-xl bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Service Registry</h3>
          {!isLoading && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-mono">AUTO-REFRESH 3s</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-1 w-full rounded-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-2.5 w-8" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                </div>
              ))
            : services.map(svc => (
                <div key={svc.name} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground truncate">{svc.name}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{
                      background: svc.status === "online" ? "hsl(160 80% 45%)" : "hsl(35 90% 55%)",
                      boxShadow: `0 0 6px ${svc.status === "online" ? "hsl(160 80% 45% / 0.6)" : "hsl(35 90% 55% / 0.6)"}`,
                    }} />
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${svc.load ?? 0}%`,
                      background: (svc.load ?? 0) > 80 ? "hsl(0 84% 60%)" : (svc.load ?? 0) > 60 ? "hsl(35 90% 55%)" : "hsl(195 100% 50%)",
                    }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">{svc.load ?? 0}%</span>
                    <span className="text-muted-foreground">{svc.ping}</span>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}