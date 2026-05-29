import { useState } from "react";
import { Save, RefreshCw, Shield, Bell, Cpu, Wifi, Key, User } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <div
        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "performance", label: "Performance", icon: Cpu },
  { id: "network", label: "Network", icon: Wifi },
  { id: "api", label: "API Keys", icon: Key },
];

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    name: "Tony Stark",
    email: "tony@stark-industries.com",
    role: "System Administrator",
    twoFactor: true,
    sessionTimeout: "30",
    auditLog: true,
    encryptAtRest: true,
    alertSound: true,
    emailNotif: true,
    systemAlerts: true,
    taskAlerts: true,
    threatAlerts: true,
    cpuThreshold: "85",
    memThreshold: "90",
    autoScale: false,
    gpuAccel: true,
    proxyEnabled: false,
    dns: "8.8.8.8",
    bandwidth: "1000",
  });

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggle(key: keyof typeof settings) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* Sidebar nav */}
      <div className="w-48 shrink-0 space-y-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-all text-left ${
              active === s.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <s.icon className="w-4 h-4 shrink-0" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="hex-border rounded-xl bg-card p-6 space-y-6">
          {active === "profile" && (
            <>
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">Profile Settings</h3>
              <div className="space-y-4">
                {[
                  { label: "Display Name", key: "name", type: "text" },
                  { label: "Email Address", key: "email", type: "email" },
                  { label: "Role", key: "role", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground font-mono tracking-wider uppercase block mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={settings[f.key as keyof typeof settings] as string}
                      onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors font-mono"
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center glow-ring">
                    <span className="text-primary text-2xl font-bold">J</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">Avatar initials auto-generated</p>
                </div>
              </div>
            </>
          )}

          {active === "security" && (
            <>
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">Security Settings</h3>
              <div className="space-y-4">
                {[
                  { label: "Two-Factor Authentication", key: "twoFactor", desc: "Require 2FA for all logins" },
                  { label: "Audit Logging", key: "auditLog", desc: "Log all user actions to audit trail" },
                  { label: "Encryption at Rest", key: "encryptAtRest", desc: "AES-256 encryption for stored data" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <p className="text-sm text-foreground font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <Toggle checked={!!settings[s.key as keyof typeof settings]} onChange={() => toggle(s.key as keyof typeof settings)} />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-muted-foreground font-mono tracking-wider uppercase block mb-1.5">Session Timeout (min)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={e => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                    className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 font-mono w-32"
                  />
                </div>
              </div>
            </>
          )}

          {active === "notifications" && (
            <>
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: "Alert Sound", key: "alertSound", desc: "Play audio on critical alerts" },
                  { label: "Email Notifications", key: "emailNotif", desc: "Send alerts to registered email" },
                  { label: "System Alerts", key: "systemAlerts", desc: "CPU, memory, disk threshold alerts" },
                  { label: "Task Alerts", key: "taskAlerts", desc: "Notify when tasks complete or fail" },
                  { label: "Threat Alerts", key: "threatAlerts", desc: "Immediate alerts on security threats" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <p className="text-sm text-foreground font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <Toggle checked={!!settings[s.key as keyof typeof settings]} onChange={() => toggle(s.key as keyof typeof settings)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "performance" && (
            <>
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">Performance Settings</h3>
              <div className="space-y-4">
                {[
                  { label: "Auto-Scale Workers", key: "autoScale", desc: "Automatically adjust worker count based on load" },
                  { label: "GPU Acceleration", key: "gpuAccel", desc: "Use GPU for ML inference tasks" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <p className="text-sm text-foreground font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    <Toggle checked={!!settings[s.key as keyof typeof settings]} onChange={() => toggle(s.key as keyof typeof settings)} />
                  </div>
                ))}
                {[
                  { label: "CPU Alert Threshold (%)", key: "cpuThreshold" },
                  { label: "Memory Alert Threshold (%)", key: "memThreshold" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground font-mono tracking-wider uppercase block mb-1.5">{f.label}</label>
                    <input
                      type="number"
                      value={settings[f.key as keyof typeof settings] as string}
                      onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 font-mono w-32"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "network" && (
            <>
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">Network Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground font-medium">Proxy Server</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Route traffic through proxy</p>
                  </div>
                  <Toggle checked={settings.proxyEnabled} onChange={() => toggle("proxyEnabled")} />
                </div>
                {[
                  { label: "Primary DNS", key: "dns" },
                  { label: "Bandwidth Limit (Mbps)", key: "bandwidth" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground font-mono tracking-wider uppercase block mb-1.5">{f.label}</label>
                    <input
                      type="text"
                      value={settings[f.key as keyof typeof settings] as string}
                      onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors font-mono"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "api" && (
            <>
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">API Key Management</h3>
              <div className="space-y-3">
                {[
                  { name: "Core API Key", key: "sk-core-•••••••••••••••••ab12", scope: "Full Access", created: "2026-01-15" },
                  { name: "Read-Only Token", key: "ro-•••••••••••••••••••cd34", scope: "Read Only", created: "2026-03-22" },
                  { name: "Webhook Secret", key: "wh-•••••••••••••••••••ef56", scope: "Webhook", created: "2026-04-10" },
                ].map(api => (
                  <div key={api.name} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{api.name}</p>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{api.scope}</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{api.key}</p>
                    <p className="text-[10px] text-muted-foreground">Created {api.created}</p>
                  </div>
                ))}
                <button className="w-full py-2 rounded-lg border border-dashed border-primary/30 text-primary/70 hover:border-primary/60 hover:text-primary text-xs font-mono transition-colors">
                  + Generate New API Key
                </button>
              </div>
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={save}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all glow-ring"
            >
              {saved ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved!" : "Save Changes"}
            </button>
            <button className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs hover:text-foreground transition-colors">
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
