import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [aadhar, setAadhar] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would validate credentials here
    navigate({ 
      to: "/dashboard/$aadharId", 
      params: { aadharId: aadhar || "111122223333" } 
    });
  };

  return (
    <div className="min-h-screen bg-hero relative flex items-center justify-center p-6 text-primary-foreground">
      <div className="grain-overlay absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        {/* Header Logo */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-primary-foreground">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-gold text-gold-foreground font-display text-xl font-bold">
              ē
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">EkID</span>
          </a>
          <p className="mt-3 text-sm text-primary-foreground/70">
            One Identity. Every Document. Zero Friction.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-8 backdrop-blur shadow-[var(--shadow-elegant)]">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
            <p className="mt-2 text-sm text-primary-foreground/70">
              Sign in to access your secure identity vault.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary-foreground/80">
                Aadhaar Number
              </label>
              <input
                type="text"
                required
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value)}
                placeholder="0000 0000 0000"
                className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-primary-foreground/80">
                  Password
                </label>
                <a href="#" className="text-xs text-gold hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110"
            >
              Access Vault <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-primary-foreground/50">
            <ShieldCheck className="h-4 w-4" />
            Secured by EkID Identity Network
          </div>
        </div>
      </div>
    </div>
  );
}
