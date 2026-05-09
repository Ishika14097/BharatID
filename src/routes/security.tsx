import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Smartphone, Key, Fingerprint, Activity, MonitorSmartphone, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/security")({
  component: SecuritySettings,
});

interface DeviceSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ip: string;
}

const mockSessions: DeviceSession[] = [
  {
    id: "1",
    device: "Windows PC - Chrome",
    location: "Bangalore, India",
    lastActive: "Just now",
    isCurrent: true,
    ip: "192.168.1.45",
  },
  {
    id: "2",
    device: "iPhone 13 - Safari",
    location: "Bangalore, India",
    lastActive: "2 hours ago",
    isCurrent: false,
    ip: "103.5.212.11",
  },
  {
    id: "3",
    device: "MacBook Pro - Safari",
    location: "Mumbai, India",
    lastActive: "3 days ago",
    isCurrent: false,
    ip: "202.144.5.1",
  },
];

function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [sessions, setSessions] = useState(mockSessions);

  const handleRevokeSession = (id: string) => {
    if (confirm("Are you sure you want to sign out from this device?")) {
      setSessions(sessions.filter((s) => s.id !== id));
      alert("Successfully signed out from the device.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-semibold text-foreground">Bharat ID</div>
              <div className="text-xs text-muted-foreground">Security Settings</div>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Security & Privacy
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your account security, two-factor authentication, and active sessions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column: Toggles & Auth Methods */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Account Protection */}
              <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="border-b border-border bg-gray-50/50 p-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Account Protection
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  
                  {/* 2FA Toggle */}
                  <div className="p-4 sm:p-6 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        Two-Factor Authentication (2FA)
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground pr-8">
                        Add an extra layer of security to your account by requiring an OTP sent to your phone upon login.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={twoFactor}
                        onChange={() => setTwoFactor(!twoFactor)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Biometrics Toggle */}
                  <div className="p-4 sm:p-6 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                        Biometric Login
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground pr-8">
                        Use Touch ID or Face ID on supported devices for faster and more secure access.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={biometrics}
                        onChange={() => setBiometrics(!biometrics)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                </div>
              </section>

              {/* Password Management */}
              <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    Change Password
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    It's a good idea to use a strong password that you're not using elsewhere.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last changed: <span className="font-medium">3 months ago</span>
                  </p>
                </div>
                <button className="flex-shrink-0 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                  Update Password
                </button>
              </section>

              {/* Active Sessions */}
              <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="border-b border-border bg-gray-50/50 p-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <MonitorSmartphone className="h-5 w-5 text-primary" />
                    Active Sessions
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These are the devices that have logged into your account.
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-4 sm:p-6 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="mt-1 flex-shrink-0">
                          {session.device.includes("Mac") || session.device.includes("PC") ? (
                            <MonitorSmartphone className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <Smartphone className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {session.device}
                            {session.isCurrent && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase">
                                This Device
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{session.location} • {session.ip}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Active: {session.lastActive}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 transition"
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No active sessions found.
                    </div>
                  )}
                </div>
              </section>

            </div>

            {/* Right Column: Security Score & Alerts */}
            <div className="space-y-6">
              
              {/* Security Health */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Security Health</h3>
                
                <div className="flex items-center justify-center mb-6">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-green-500 bg-green-50">
                    <div className="text-center">
                      <span className="text-3xl font-display font-bold text-green-700">
                        {twoFactor ? "100%" : "70%"}
                      </span>
                      <p className="text-xs font-medium text-green-800">Excellent</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Email Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>Phone Number Verified</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${twoFactor ? "text-green-700" : "text-amber-600"}`}>
                    {twoFactor ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <ShieldAlert className="h-4 w-4 flex-shrink-0" />}
                    <span>{twoFactor ? "2FA Enabled" : "Enable 2FA for better security"}</span>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Security Alerts</h3>
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">SMS Alerts</h4>
                    <p className="text-xs text-muted-foreground pr-4 mt-1">Receive SMS notifications for new logins and shared document access.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={smsAlerts}
                      onChange={() => setSmsAlerts(!smsAlerts)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between opacity-60">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Email Alerts</h4>
                    <p className="text-xs text-muted-foreground pr-4 mt-1">Receive email notifications for weekly security summaries.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed flex-shrink-0 mt-1">
                    <input type="checkbox" className="sr-only peer" disabled checked={true} />
                    <div className="w-9 h-5 bg-primary/60 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[18px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4"></div>
                  </label>
                </div>

              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
