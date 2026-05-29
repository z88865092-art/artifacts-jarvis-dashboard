export interface HealthStatus {
  status: string;
}

export type ServiceInfoStatus = typeof ServiceInfoStatus[keyof typeof ServiceInfoStatus];

export const ServiceInfoStatus = {
  online: 'online',
  degraded: 'degraded',
  offline: 'offline',
} as const;

export interface ServiceInfo {
  name: string;
  status: ServiceInfoStatus;
  load: number;
  ping: string;
}

export type TaskInfoStatus = typeof TaskInfoStatus[keyof typeof TaskInfoStatus];

export const TaskInfoStatus = {
  running: 'running',
  done: 'done',
  failed: 'failed',
} as const;

export type TaskInfoPriority = typeof TaskInfoPriority[keyof typeof TaskInfoPriority];

export const TaskInfoPriority = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
} as const;

export interface TaskInfo {
  id: number;
  name: string;
  progress: number;
  status: TaskInfoStatus;
  priority: TaskInfoPriority;
}

export type AlertInfoType = typeof AlertInfoType[keyof typeof AlertInfoType];

export const AlertInfoType = {
  info: 'info',
  warn: 'warn',
  success: 'success',
  error: 'error',
} as const;

export interface AlertInfo {
  type: AlertInfoType;
  msg: string;
  time: string;
}

export type SystemStatsRam = {
  used: number;
  total: number;
  percent: number;
};

export type SystemStatsNetwork = {
  upload: number;
  download: number;
};

export interface SystemStats {
  cpu: number;
  ram: SystemStatsRam;
  network: SystemStatsNetwork;
  uptime: number;
  latency: number;
  threatsBlocked: number;
  services: ServiceInfo[];
  tasks: TaskInfo[];
  alerts: AlertInfo[];
}
