// Vercel Serverless Function — GET /api/system/stats
// Root Directory: artifacts/jarvis-dashboard  →  URL path: /api/system/stats

import type { IncomingMessage, ServerResponse } from "http";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function randInt(base: number, spread: number): number {
  return Math.round(clamp(base + (Math.random() - 0.5) * spread * 2, base - spread, base + spread));
}

function randFloat(base: number, spread: number): number {
  return Math.round(clamp(base + (Math.random() - 0.5) * spread * 2, base - spread, base + spread) * 10) / 10;
}

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age":       "86400",
    });
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const cpu      = randFloat(74, 12);
  const ramUsed  = randFloat(6.2, 0.4);
  const ramTotal = 7.6;
  const netDown  = randInt(253, 60);
  const netUp    = randInt(89, 30);

  const body = JSON.stringify({
    cpu,
    ram: {
      used:    ramUsed,
      total:   ramTotal,
      percent: Math.round((ramUsed / ramTotal) * 1000) / 10,
    },
    network: { upload: netUp, download: netDown },
    uptime:  99.8,
    latency: randInt(12, 6),
    threatsBlocked: 18,

    services: [
      { name: "Core API",      status: "online",   load: randInt(68, 8),  ping: `${randInt(4,  2)}ms`  },
      { name: "Auth Service",  status: "online",   load: randInt(32, 8),  ping: `${randInt(8,  4)}ms`  },
      { name: "Data Pipeline", status: "degraded", load: randInt(91, 4),  ping: `${randInt(120,20)}ms` },
      { name: "ML Engine",     status: "online",   load: randInt(77, 8),  ping: `${randInt(22, 6)}ms`  },
      { name: "Cache Layer",   status: "online",   load: randInt(45, 10), ping: `${randInt(1,  1)}ms`  },
      { name: "Message Queue", status: "online",   load: randInt(58, 10), ping: `${randInt(3,  2)}ms`  },
      { name: "File Storage",  status: "online",   load: randInt(29, 8),  ping: `${randInt(15, 5)}ms`  },
      { name: "Monitoring",    status: "online",   load: randInt(20, 6),  ping: `${randInt(6,  3)}ms`  },
    ],

    tasks: [
      { id: 1, name: "Data Sync Protocol",  progress: randInt(87, 2), status: "running", priority: "high"     },
      { id: 2, name: "Security Audit Scan", progress: randInt(42, 3), status: "running", priority: "critical" },
      { id: 3, name: "Cache Optimization",  progress: 100,            status: "done",    priority: "medium"   },
      { id: 4, name: "Neural Net Training", progress: randInt(63, 4), status: "running", priority: "high"     },
      { id: 5, name: "Log Archival",        progress: 100,            status: "done",    priority: "low"      },
    ],

    alerts: [
      { type: "warn",    msg: `Memory usage at ${Math.round((ramUsed / ramTotal) * 100)}% — consider clearing cache`, time: "2m ago"  },
      { type: "info",    msg: "Scheduled maintenance window in 4 hours",                                              time: "15m ago" },
      { type: "success", msg: "Backup completed successfully (14.2 GB)",                                              time: "1h ago"  },
    ],
  });

  res.writeHead(200, {
    "Content-Type":                "application/json",
    "Cache-Control":               "no-store, must-revalidate",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}
