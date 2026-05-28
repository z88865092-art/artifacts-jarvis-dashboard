import { useState } from "react";
import {
  CheckCircle, Clock, AlertTriangle, Plus, Filter,
  ChevronRight, Trash2, Play, Pause, RefreshCw,
} from "lucide-react";

interface Task {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: "running" | "done" | "paused" | "failed";
  priority: "critical" | "high" | "medium" | "low";
  assignee: string;
  eta: string;
  created: string;
}

const initialTasks: Task[] = [
  { id: 1, name: "Data Sync Protocol", description: "Synchronizing 2.4TB dataset across distributed nodes", progress: 87, status: "running", priority: "high", assignee: "Core Engine", eta: "~8 min", created: "10:15" },
  { id: 2, name: "Security Audit Scan", description: "Full vulnerability assessment on all exposed endpoints", progress: 42, status: "running", priority: "critical", assignee: "Security Module", eta: "~23 min", created: "10:22" },
  { id: 3, name: "Cache Optimization", description: "Purge stale keys and rebuild index structures", progress: 100, status: "done", priority: "medium", assignee: "Cache Layer", eta: "Done", created: "09:45" },
  { id: 4, name: "Neural Net Training", description: "Epoch 63/100 — batch size 512, LR=0.001", progress: 63, status: "running", priority: "high", assignee: "ML Engine", eta: "~42 min", created: "09:30" },
  { id: 5, name: "Log Archival", description: "Compress and archive logs older than 30 days", progress: 100, status: "done", priority: "low", assignee: "Storage", eta: "Done", created: "08:00" },
  { id: 6, name: "API Rate Limit Recalibration", description: "Adjust throttling limits based on traffic analysis", progress: 0, status: "paused", priority: "medium", assignee: "Core API", eta: "Paused", created: "11:00" },
  { id: 7, name: "Firmware Update — Sensor Node 7", description: "Critical patch for memory overflow vulnerability", progress: 0, status: "failed", priority: "critical", assignee: "IoT Module", eta: "Failed", created: "10:50" },
];

const statusColor = {
  running: "text-primary bg-primary/10 border-primary/30",
  done: "text-green-400 bg-green-400/10 border-green-400/30",
  paused: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  failed: "text-red-400 bg-red-400/10 border-red-400/30",
};

const priorityColor = {
  critical: "text-red-400 bg-red-400/10",
  high: "text-orange-400 bg-orange-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  low: "text-muted-foreground bg-muted/30",
};

const progressColor = {
  running: "hsl(195 100% 50%)",
  done: "hsl(160 80% 45%)",
  paused: "hsl(35 90% 55%)",
  failed: "hsl(0 84% 60%)",
};

export default function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<"all" | "running" | "done" | "paused" | "failed">("all");
  const [newTaskName, setNewTaskName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = tasks.filter(t => filter === "all" || t.status === filter);
  const counts = {
    all: tasks.length,
    running: tasks.filter(t => t.status === "running").length,
    done: tasks.filter(t => t.status === "done").length,
    paused: tasks.filter(t => t.status === "paused").length,
    failed: tasks.filter(t => t.status === "failed").length,
  };

  function addTask() {
    if (!newTaskName.trim()) return;
    setTasks(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newTaskName.trim(),
        description: "User-created task",
        progress: 0,
        status: "paused",
        priority: "medium",
        assignee: "Manual",
        eta: "Pending",
        created: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setNewTaskName("");
    setShowAdd(false);
  }

  function togglePause(id: number) {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, status: t.status === "running" ? "paused" : t.status === "paused" ? "running" : t.status }
        : t
    ));
  }

  function deleteTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function retryTask(id: number) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: "running", progress: 0 } : t
    ));
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Task Manager</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {counts.running} running · {counts.done} done · {counts.failed} failed
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity glow-ring"
        >
          <Plus className="w-3.5 h-3.5" />
          New Task
        </button>
      </div>

      {/* Add task input */}
      {showAdd && (
        <div className="hex-border rounded-xl bg-card p-4 flex items-center gap-3 slide-up">
          <input
            autoFocus
            type="text"
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="Enter task name..."
            className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors font-mono"
          />
          <button onClick={addTask} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
            Add
          </button>
          <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground text-xs">
            Cancel
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {(["all", "running", "done", "paused", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
              filter === f
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.map(task => (
          <div key={task.id} className="hex-border rounded-xl bg-card p-4 group hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {task.status === "done"
                  ? <CheckCircle className="w-5 h-5 text-green-400" />
                  : task.status === "running"
                  ? <Clock className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                  : task.status === "failed"
                  ? <AlertTriangle className="w-5 h-5 text-red-400" />
                  : <Pause className="w-5 h-5 text-yellow-400" />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{task.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${priorityColor[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${statusColor[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{task.assignee}</span>
                    <span>ETA: {task.eta} · Created {task.created}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${task.progress}%`,
                        background: progressColor[task.status],
                        boxShadow: task.status === "running" ? `0 0 8px ${progressColor[task.status]}80` : undefined,
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground text-right">{task.progress}%</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                {(task.status === "running" || task.status === "paused") && (
                  <button
                    onClick={() => togglePause(task.id)}
                    className="w-7 h-7 rounded-md bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground flex items-center justify-center transition-colors"
                    title={task.status === "running" ? "Pause" : "Resume"}
                  >
                    {task.status === "running" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                )}
                {task.status === "failed" && (
                  <button
                    onClick={() => retryTask(task.id)}
                    className="w-7 h-7 rounded-md bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground flex items-center justify-center transition-colors"
                    title="Retry"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="w-7 h-7 rounded-md bg-muted hover:bg-red-400/20 hover:text-red-400 text-muted-foreground flex items-center justify-center transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button className="w-7 h-7 rounded-md bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground flex items-center justify-center transition-colors">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
