import { Router, type IRouter } from "express";
import { GetSystemStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Simulated mutable state — drifts over time to feel live
let cpu = 74;
let tasks = [
  { id: 1, name: "Data Sync Protocol",  progress: 87, status: "running" as const, priority: "high" as const },
  { id: 2, name: "Security Audit Scan", progress: 42, status: "running" as const, priority: "critical" as const },
  { id: 3, name: "Cache Optimization",  progress: 100, status: "done" as const,   priority: "medium" as const },
  { id: 4, name: "Neural Net Training", progress: 63, status: "running" as const, priority: "high" as const },
  { id: 5, name: "Log Archival",        progress: 100, status: "done" as const,   priority: "low" as const },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function drift() {
  cpu = clamp(cpu + (Math.random() - 0.5) * 6, 20, 95);
  tasks = tasks.map(t =>
    t.status === "running"
      ? { ...t, progress: clamp(t.progress + Math.random() * 0.4, 0, 99) }
      : t,
  );
}

router.get("/system/stats", (req, res) => {
  drift();

  const ramUsed   = clamp(6.2 + (Math.random() - 0.5) * 0.3, 4, 7.5);
  const ramTotal  = 7.6;
  const netDown   = clamp(253 + (Math.random() - 0.5) * 40, 80, 400);
  const netUp     = clamp(89  + (Math.random() - 0.5) * 20, 20, 200);

  const data = GetSystemStatsResponse.parse({
    cpu:            Math.round(cpu * 10) / 10,
    ram:            { used: Math.round(ramUsed * 10) / 10, total: ramTotal, percent: Math.round(ramUsed / ramTotal * 1000) / 10 },
    network:        { upload: Math.round(netUp), download: Math.round(netDown) },
    uptime:         99.8,
    latency:        Math.round(8 + Math.random() * 8),
    threatsBlocked: 18,
    services: [
      { name: "Core API",      status: "online",   load: Math.round(68 + (Math.random() - 0.5) * 10), ping: `${Math.round(4  + Math.random() * 2)}ms` },
      { name: "Auth Service",  status: "online",   load: Math.round(32 + (Math.random() - 0.5) * 8),  ping: `${Math.round(8  + Math.random() * 4)}ms` },
      { name: "Data Pipeline", status: "degraded", load: Math.round(91 + (Math.random() - 0.5) * 4),  ping: `${Math.round(120 + Math.random() * 20)}ms` },
      { name: "ML Engine",     status: "online",   load: Math.round(77 + (Math.random() - 0.5) * 8),  ping: `${Math.round(22 + Math.random() * 6)}ms` },
      { name: "Cache Layer",   status: "online",   load: Math.round(45 + (Math.random() - 0.5) * 10), ping: `${Math.round(1  + Math.random() * 1)}ms` },
      { name: "Message Queue", status: "online",   load: Math.round(58 + (Math.random() - 0.5) * 10), ping: `${Math.round(3  + Math.random() * 2)}ms` },
      { name: "File Storage",  status: "online",   load: Math.round(29 + (Math.random() - 0.5) * 8),  ping: `${Math.round(15 + Math.random() * 5)}ms` },
      { name: "Monitoring",    status: "online",   load: Math.round(20 + (Math.random() - 0.5) * 6),  ping: `${Math.round(6  + Math.random() * 3)}ms` },
    ],
    tasks: tasks.map(t => ({ ...t, progress: Math.round(t.progress) })),
    alerts: [
      { type: "warn",    msg: `Memory usage at ${Math.round(ramUsed / ramTotal * 100)}% — consider clearing cache`, time: "2m ago" },
      { type: "info",    msg: "Scheduled maintenance window in 4 hours",      time: "15m ago" },
      { type: "success", msg: "Backup completed successfully (14.2 GB)",       time: "1h ago"  },
    ],
  });

  req.log.info({ cpu: data.cpu }, "system/stats served");
  res.json(data);
});

export default router;
