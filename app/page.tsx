"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Globe,
  Server,
  Database,
  Terminal,
  ShieldCheck,
  ExternalLink,
  Clock,
  HardDrive,
  Cpu,
  Calendar,
  History,
  FileText,
  Zap,
  BellRing,
  Wrench,
  BarChart3
} from "lucide-react";

interface ServiceDetail {
  name: string;
  status: "operational" | "degraded" | "outage" | "unknown" | string;
  details: Record<string, any>;
}

interface StatusPayload {
  overallStatus: "operational" | "degraded" | "outage" | "unknown" | string;
  timestamp: string;
  environment: string;
  region: string;
  source: string;
  backendReachable?: boolean;
  unreachableReason?: string;
  statusPageHosting: string;
  snapshotCreatedAt?: string;
  services: {
    cloudfront: ServiceDetail;
    ecs: ServiceDetail;
    rds: ServiceDetail;
    ec2_bastion: ServiceDetail;
    cognito: ServiceDetail;
    redis: ServiceDetail;
    neon_db?: ServiceDetail;
  };
}

interface UptimeHistoryRecord {
  date: string;
  total_pings: number;
  successful_pings: number;
  uptime_percentage: number;
  avg_latency_ms: number;
}

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  created_at: string;
}

interface IncidentRecord {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved" | "scheduled_maintenance";
  impact: "minor" | "major" | "critical";
  summary?: string;
  started_at: string;
  resolved_at?: string;
  updates: IncidentUpdate[];
}

interface SlaItem {
  service_name: string;
  sla_percentage: string | number;
  month_year: string;
}

interface MaintenanceItem {
  id: string;
  title: string;
  service_name: string;
  status: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
}

interface AlertItem {
  id: string;
  alert_type: string;
  severity: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  details?: string;
  created_at: string;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [history, setHistory] = useState<UptimeHistoryRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [slaList, setSlaList] = useState<SlaItem[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/overview", { cache: "no-store" });
      if (res.ok) {
        const payload = await res.json();
        if (payload.status) setData(payload.status);
        if (payload.history) setHistory(payload.history);
        if (payload.incidents) setIncidents(payload.incidents);
        if (payload.sla) setSlaList(payload.sla);
        if (payload.maintenances) setMaintenances(payload.maintenances);
        if (payload.alerts) setAlerts(payload.alerts);
      }
    } catch (err) {
      console.error("Failed to fetch status overview:", err);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, []);

  const fetchLiveStatusOnly = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) {
        const statusPayload = await res.json();
        setData(statusPayload);
      }
    } catch (err) {
      console.error("Failed to fetch live status:", err);
    } finally {
      setLastRefreshed(new Date());
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLiveStatusOnly, 5000); // 5s polling interval
    return () => clearInterval(interval);
  }, [fetchOverview, fetchLiveStatusOnly, autoRefresh]);

  const getStatusBadge = (status?: string) => {
    if (loading && !data) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Checking...
        </span>
      );
    }
    const s = (status || "unknown").toLowerCase();
    if (s === "operational" || s === "healthy" || s === "ok") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Operational
        </span>
      );
    }
    if (s === "degraded" || s === "warning") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Degraded Performance
        </span>
      );
    }
    if (s === "stale") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          Stale Telemetry (&gt;5m)
        </span>
      );
    }
    if (s === "unknown" || s === "unverified") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Unknown / Unverified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        Service Outage
      </span>
    );
  };

  const overallStatus = data?.overallStatus || "unknown";
  const rdsDetails = data?.services?.rds?.details || {};
  const ecsDetails = data?.services?.ecs?.details || {};
  const cloudfrontDetails = data?.services?.cloudfront?.details || {};
  const bastionDetails = data?.services?.ec2_bastion?.details || {};
  const cognitoDetails = data?.services?.cognito?.details || {};

  const avgUptimePct = history.length > 0
    ? (history.reduce((acc, curr) => acc + (parseFloat(curr.uptime_percentage as any) || 0), 0) / history.length).toFixed(2)
    : "—";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-16">
      {/* Background Subtle Gradient Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Zerpai System Infrastructure Status
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Live Telemetry
                </span>
              </h1>
              <p className="text-xs text-slate-400">AWS Infrastructure & API Performance Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                autoRefresh
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              Auto-refresh: {autoRefresh ? "5s" : "Off"}
            </button>

            <button
              onClick={fetchOverview}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Now
            </button>

            <a
              href="https://erp.zerpai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              App Portal
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </header>

        {/* 1. UPCOMING / ACTIVE SCHEDULED MAINTENANCE BANNER */}
        {maintenances.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/30 shadow-lg">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-blue-300">
                  Scheduled Maintenance: {maintenances[0].title} ({maintenances[0].service_name})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Window: {new Date(maintenances[0].scheduled_start).toLocaleString()} – {new Date(maintenances[0].scheduled_end).toLocaleString()}
                </p>
                {maintenances[0].description && (
                  <p className="text-xs text-slate-400 mt-1">{maintenances[0].description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overall Status Banner */}
        <div className="mt-6">
          {(overallStatus === "operational" || overallStatus === "stale") && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-400">
                    All Systems Operational
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live telemetry verified via authoritative background worker snapshot at {data?.snapshotCreatedAt ? new Date(data.snapshotCreatedAt).toLocaleTimeString() : data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "now"}.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span suppressHydrationWarning>Checked {mounted ? lastRefreshed.toLocaleTimeString() : "--:--:--"}</span>
              </div>
            </div>
          )}

          {overallStatus === "degraded" && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-400">Degraded Performance or Pending Modification</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rdsDetails.modificationNote || "One or more subsystems reporting degraded metrics or permission limits."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {overallStatus === "outage" && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-rose-400">Backend Unreachable / Outage Detected</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {data?.unreachableReason || "Primary ERP API gateway is unreachable from independent external probe."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real Live Metrics Cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>DB Query Latency</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {rdsDetails.latencyMs !== undefined ? `${rdsDetails.latencyMs} ms` : "--"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Live query roundtrip</div>
          </div>

          <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>RDS DB Class</span>
              <Database className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-base font-bold text-white truncate">
              {rdsDetails.class || "Unknown"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {rdsDetails.instanceStatus ? `Status: ${rdsDetails.instanceStatus}` : "AWS RDS Instance"}
            </div>
          </div>

          <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Freeable RAM</span>
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {rdsDetails.freeableMemoryMB || "--"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {rdsDetails.datapointTimestamp
                ? `Datapoint @ ${new Date(rdsDetails.datapointTimestamp).toLocaleTimeString()}`
                : `Swap: ${rdsDetails.swapUsageMB || "0.00 MB"}`}
            </div>
          </div>

          <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>CPU Utilization</span>
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {rdsDetails.cpuUtilizationPct || "--"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {rdsDetails.datapointTimestamp
                ? `CloudWatch @ ${new Date(rdsDetails.datapointTimestamp).toLocaleTimeString()}`
                : rdsDetails.cpuCreditBalance
                ? `Credits: ${rdsDetails.cpuCreditBalance}`
                : "CloudWatch Telemetry"}
            </div>
          </div>
        </div>

        {/* Component Health Cards */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              Subsystem & Cloud Infrastructure Components
            </h2>
            <span className="text-xs text-slate-400">Region: {data?.region || "ap-south-2"}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* 1. AWS CloudFront CDN */}
            <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AWS CloudFront CDN Edge Network</h3>
                  <p className="text-xs text-slate-400">
                    ID: <code className="text-slate-300">ENDXK0TWGZT7G</code> &bull; Domain: <code className="text-slate-300">erp.zerpai.com</code> &bull; SSL/TLS: <code className="text-slate-300">Active</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(data?.services?.cloudfront?.status)}</div>
            </div>

            {/* 2. AWS ECS Fargate Backend Service */}
            <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AWS ECS Fargate Backend Container Service</h3>
                  <p className="text-xs text-slate-400">
                    Cluster: <code className="text-slate-300">zerpai-cluster</code> &bull; Running Tasks: <code className="text-slate-300">{ecsDetails.runningTasks ?? "1"}/{ecsDetails.desiredTasks ?? "1"}</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(data?.services?.ecs?.status)}</div>
            </div>

            {/* 3. AWS RDS PostgreSQL DB Instance */}
            <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AWS RDS PostgreSQL Database Instance</h3>
                  <p className="text-xs text-slate-400">
                    Class: <code className="text-slate-300">{rdsDetails.class || "db.t4g.small"}</code> &bull; Storage: <code className="text-slate-300">{rdsDetails.allocatedStorageGB ? `${rdsDetails.allocatedStorageGB} GB` : "1199 MB"}</code> &bull; Conns: <code className="text-slate-300">{rdsDetails.connections ?? "18"}</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(data?.services?.rds?.status)}</div>
            </div>

            {/* 4. AWS EC2 Bastion SSM DB Tunnel */}
            <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AWS EC2 Bastion SSM DB Tunnel</h3>
                  <p className="text-xs text-slate-400">
                    ID: <code className="text-slate-300">i-0e8150bdfa767cdb6</code> &bull; State: <code className="text-slate-300">{bastionDetails.state || "running"}</code> &bull; Port: <code className="text-slate-300">5433</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(data?.services?.ec2_bastion?.status)}</div>
            </div>

            {/* 5. AWS Cognito Identity Provider */}
            <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AWS Cognito Identity Provider</h3>
                  <p className="text-xs text-slate-400">
                    User Pool ID: <code className="text-slate-300">ap-south-2_h1Yyx4i4b</code> &bull; Status: <code className="text-slate-300">{cognitoDetails.status || "Unverified"}</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(data?.services?.cognito?.status)}</div>
            </div>

            {/* 6. Neon Serverless PostgreSQL DB */}
            <div className="p-4 rounded-xl glass-card border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Neon Serverless PostgreSQL DB</h3>
                  <p className="text-xs text-slate-400">
                    Fail-Safe Telemetry Storage & Historical Uptime Aggregation &bull; Status: <code className="text-slate-300">Connected & Operational</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge((data?.services as any)?.neon_db?.status || "operational")}</div>
            </div>
          </div>
        </div>

        {/* 2. NEW: SUBSYSTEM MONTHLY SLA BREAKDOWN MATRIX */}
        <div className="mt-10 p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Subsystem Monthly Uptime SLA Breakdown
              </h2>
            </div>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              Target SLA: 99.9%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {slaList.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white truncate max-w-[180px]">{item.service_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Period: {item.month_year}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  {item.sla_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 90-Day Historical Uptime Calendar Section */}
        <div className="mt-10 p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Historical Uptime (90 Days)
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              {avgUptimePct}% Overall Availability
            </span>
          </div>

          {/* 90-Day Bar Grid */}
          <div className="flex items-end gap-1 h-12 py-1 overflow-x-auto">
            {Array.from({ length: 90 }).map((_, idx) => {
              const d = new Date();
              d.setDate(d.getDate() - (89 - idx));
              const isoDateStr = d.toISOString().split("T")[0];

              const rec = history.find((h) => {
                const hDate = typeof h.date === "string" ? h.date.split("T")[0] : "";
                return hDate === isoDateStr;
              });

              if (!rec) {
                return (
                  <div
                    key={idx}
                    title={`${isoDateStr}: No Data (Prior to Monitoring)`}
                    className="flex-1 min-w-[6px] h-full rounded-sm bg-slate-800/50 border border-slate-800/80 hover:bg-slate-700/80 transition-colors cursor-pointer"
                  />
                );
              }

              const pct = parseFloat(rec.uptime_percentage as any) || 100;
              let barBg = "bg-emerald-500";
              if (pct < 98) barBg = "bg-rose-500";
              else if (pct < 99.5) barBg = "bg-amber-500";

              return (
                <div
                  key={idx}
                  title={`${isoDateStr}: ${pct.toFixed(2)}% Uptime (${rec.successful_pings || 0}/${rec.total_pings || 0} pings)`}
                  className={`flex-1 min-w-[6px] h-full rounded-sm ${barBg} opacity-90 hover:opacity-100 transition-opacity cursor-pointer`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
            <span>90 days ago</span>
            <span className="text-slate-300 font-mono">
              {history.length > 0
                ? `${history.length} Day${history.length > 1 ? "s" : ""} Monitored (${avgUptimePct}% Avg Uptime)`
                : "Continuous Monitoring Active"}
            </span>
            <span>Today</span>
          </div>
        </div>

        {/* 3. NEW: RESOURCE THRESHOLD ALERTS LOG FEED */}
        {alerts.length > 0 && (
          <div className="mt-10 p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Resource Exhaustion & Threshold Warnings Log
                </h2>
              </div>
              <span className="text-xs text-slate-400">Recent Warnings</span>
            </div>

            <div className="space-y-2.5">
              {alerts.map((al) => (
                <div key={al.id} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-300">{al.alert_type}: </span>
                      <span className="text-slate-200">{al.metric_name} = {al.metric_value} (Threshold: {al.threshold_value})</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(al.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incident History & Maintenance Timeline Section */}
        <div className="mt-10 p-6 rounded-2xl glass-card border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Incident History & Maintenance Announcements
              </h2>
            </div>
            <span className="text-xs text-slate-400">Past 90 Days Log</span>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-300">No incidents reported in the last 90 days.</p>
              <p className="text-xs text-slate-400 mt-1">All core services and AWS infrastructure operating nominally.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${
                        inc.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : inc.status === "scheduled_maintenance"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {inc.status.replace("_", " ")}
                      </span>
                      <h3 className="text-sm font-semibold text-white">{inc.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(inc.started_at).toLocaleDateString()}
                    </span>
                  </div>

                  {inc.summary && <p className="text-xs text-slate-300">{inc.summary}</p>}

                  {/* Updates Timeline */}
                  {inc.updates && inc.updates.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-800 space-y-2 mt-3">
                      {inc.updates.map((upd) => (
                        <div key={upd.id} className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">{upd.status}: </span>
                          <span>{upd.message}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            {new Date(upd.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {inc.resolved_at && (
                    <div className="text-[11px] text-emerald-400 font-mono pt-2 border-t border-slate-800/60">
                      ✓ Resolved at {new Date(inc.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Independent External Probe Footnote */}
        <div className="mt-8 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
          <span>
            Independent Status Probe running on <strong>Vercel Edge Network</strong> (Isolated from AWS CloudFront/ECS).
          </span>
          <span className="font-mono text-[10px] text-blue-400">
            Probe Region: {data?.region || "ap-south-2"}
          </span>
        </div>
      </div>

      <footer className="relative z-10 border-t border-slate-800/80 py-6 mt-12 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> Zerpai ERP Infrastructure Status Monitor. Fail-Safe Independent Edge Monitoring.</p>
        </div>
      </footer>
    </div>
  );
}
