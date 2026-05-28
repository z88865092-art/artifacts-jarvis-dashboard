import { useState, useEffect } from "react";
import { Cpu, HardDrive, Wifi, Thermometer, Activity, Server, MemoryStick } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";

function GaugeCard({
  label, value, max, unit, color, icon: Icon, sub,
}: {
  label: string; value: number; max: number; unit: string;
  color: string; icon: React.ElementType; sub?: string;
}) {
  const pct = Math.round((value / max) * 100);
  const data = [{ name: label, value: pct, fill: color }];

  return (
    <div className="hex-border rounded-xl bg-card p-4 flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={data}
            startAngle={220}
            endAngle={-40}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "hsl(222 40% 14%)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-1" style={{ color }} />
          <span className="text-lg font-bold font-mono text-foreground tabular-nums">{value}</span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub}</p>}
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{pct}% utilized</span>
    </div>
  );
}

const processes = [
  { name: "jarvis_core", cpu: 12.4, mem: 892, status: "running" },
  { name: "ml_inference", cpu: 34.8, mem: 2048, status: "running" },
  { name: "data_pipeline", cpu: 28.1, mem: 1456, status: "high" },
  { name: "auth_service", cpu: 2.3, mem: 234, status: "running" },
  { name: "cache_daemon", cpu: 1.1, mem: 156, status: "running" },
  { name: "log_aggregator", cpu: 0.8, mem: 78, status: "running" },
  { name: "network_proxy", cpu: 4.2, mem: 312, status: "running" },
  { name: "backup_worker", cpu: 8.9, mem: 512, status: "running" },
];

export default function Systems() {
  const [cpu, setCpu] = useState(74);
  const [temp, setTemp] = useState(58);

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(prev => Math.max(20, Math.min(95, prev + (Math.random() - 0.5) * 6)));
      setTemp(prev => Math.max(45, Math.min(85, prev + (Math.random() - 0.5) * 3)));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">System Monitor</h2>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Real-time hardware & process telemetry</p>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GaugeCard label="CPU" value={cpu} max={100} unit="%" color="hsl(195 100% 50%)" icon={Cpu} sub={`8 cores · 4.2GHz`} />
        <GaugeCard label="Memory" value={6.2} max={7.6} unit="GB" color="hsl(270 80% 65%)" icon={MemoryStick} sub="6.2 / 7.6 GB" />
        <GaugeCard label="Storage" value={842} max={1024} unit="GB" color="hsl(35 90% 55%)" icon={HardDrive} sub="SSD · 1TB" />
        <GaugeCard label="CPU Temp" value={temp} max={100} unit="°C" color={temp > 70 ? "hsl(0 84% 60%)" : "hsl(160 80% 45%)"} icon={Thermometer} sub={temp > 70 ? "Above normal" : "Normal range"} />
      </div>

      {/* Network + IO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Network */}
        <div className="hex-border rounded-xl bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Network Interfaces</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "eth0", status: "UP", ip: "192.168.1.42", rx: "253 MB/s", tx: "89 MB/s", speed: "1 Gbps" },
              { name: "wlan0", status: "UP", ip: "192.168.1.43", rx: "12 MB/s", tx: "4 MB/s", speed: "300 Mbps" },
              { name: "lo", status: "UP", ip: "127.0.0.1", rx: "—", tx: "—", speed: "Loopback" },
              { name: "tun0", status: "DOWN", ip: "—", rx: "—", tx: "—", speed: "VPN tunnel" },
            ].map(iface => (
              <div key={iface.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: iface.status === "UP" ? "hsl(160 80% 45%)" : "hsl(0 84% 60%)",
                    boxShadow: iface.status === "UP" ? "0 0 6px hsl(160 80% 45% / 0.5)" : "none",
                  }}
                />
                <span className="text-xs font-mono text-foreground w-12 shrink-0">{iface.name}</span>
                <span className="text-[10px] text-muted-foreground flex-1 font-mono">{iface.ip}</span>
                <div className="text-[10px] text-muted-foreground font-mono text-right">
                  <div>↓ {iface.rx}</div>
                  <div>↑ {iface.tx}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disk IO */}
        <div className="hex-border rounded-xl bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Disk I/O</h3>
          </div>
          <div className="space-y-3">
            {[
              { path: "/", total: "1TB", used: "842GB", pct: 82, type: "NVMe SSD" },
              { path: "/data", total: "4TB", used: "1.8TB", pct: 45, type: "HDD RAID" },
              { path: "/boot", total: "512MB", used: "124MB", pct: 24, type: "eMMC" },
              { path: "/tmp", total: "8GB", used: "1.2GB", pct: 15, type: "tmpfs" },
            ].map(disk => (
              <div key={disk.path} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-foreground">{disk.path}</span>
                  <span className="text-muted-foreground">{disk.used} / {disk.total} · {disk.type}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${disk.pct}%`,
                      background: disk.pct > 80 ? "hsl(0 84% 60%)"
                        : disk.pct > 60 ? "hsl(35 90% 55%)"
                        : "hsl(195 100% 50%)",
                      boxShadow: "0 0 4px hsl(195 100% 50% / 0.4)",
                    }}
                  />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">{disk.pct}% used</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process table */}
      <div className="hex-border rounded-xl bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">Top Processes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {["Process", "CPU %", "Memory", "Status"].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest text-muted-foreground py-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((p, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 pr-4 text-foreground">{p.name}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(p.cpu / 40 * 100, 100)}%`,
                            background: p.cpu > 25 ? "hsl(0 84% 60%)" : "hsl(195 100% 50%)",
                          }}
                        />
                      </div>
                      <span className={p.cpu > 25 ? "text-red-400" : "text-foreground"}>{p.cpu}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{p.mem} MB</td>
                  <td className="py-2.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] uppercase"
                      style={{
                        background: p.status === "high" ? "hsl(0 84% 60% / 0.15)" : "hsl(160 80% 45% / 0.12)",
                        color: p.status === "high" ? "hsl(0 84% 70%)" : "hsl(160 80% 55%)",
                      }}
                    >
                      {p.status === "high" ? "HIGH LOAD" : "RUNNING"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
