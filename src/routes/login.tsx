import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ArrowRight, ShieldCheck, User, Phone, Mail, Eye, EyeOff } from "lucide-react";
import { signupUser, loginUser } from "../lib/auth-server-fns";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signupUser({ data: { name, phone, email, password } });
    if (result.success) {
      localStorage.setItem("userId", result.userId!);
      localStorage.setItem("userName", result.name!);
      navigate({ to: "/dashboard/$aadharId", params: { aadharId: result.userId! } });
    } else {
      alert(result.message || "Signup failed");
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginUser({ data: { email, password } });
    if (result.success) {
      localStorage.setItem("userId", result.userId!);
      localStorage.setItem("userName", result.name!);
      navigate({ to: "/dashboard/$aadharId", params: { aadharId: result.userId! } });
    } else {
      alert(result.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-hero relative flex items-center justify-center p-6 text-primary-foreground">
      <div className="grain-overlay absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-primary-foreground">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-gold text-gold-foreground font-display text-xl font-bold">
              B
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">BharatID</span>
          </a>
          <p className="mt-3 text-sm text-primary-foreground/70">
            One Identity. Every Document. Zero Friction.
          </p>
        </div>

        <div className="rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-8 backdrop-blur shadow-[var(--shadow-elegant)]">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold">
              {isSignup ? "Create Account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/70">
              {isSignup ? "Sign up to create your secure identity vault." : "Sign in to access your secure identity vault."}
            </p>
          </div>

          <div className="mb-6 flex rounded-xl border border-primary-foreground/20 p-1">
            <button type="button" onClick={() => setIsSignup(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${!isSignup ? "bg-gold text-gold-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
              Login
            </button>
            <button type="button" onClick={() => setIsSignup(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${isSignup ? "bg-gold text-gold-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
              Sign Up
            </button>
          </div>

          {isSignup ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-foreground/80">Full Name</label>
                <div className="relative">
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-foreground/80">Phone Number</label>
                <div className="relative">
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-foreground/80">Email</label>
                <div className="relative">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-foreground/80">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5">
                    {showPassword ? <EyeOff className="h-4 w-4 text-primary-foreground/50" /> : <Eye className="h-4 w-4 text-primary-foreground/50" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110 disabled:opacity-50">
                {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-foreground/80">Email</label>
                <div className="relative">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary-foreground/80">Password</label>
                  <a href="#" className="text-xs text-gold hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 pl-10 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-primary-foreground/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5">
                    {showPassword ? <EyeOff className="h-4 w-4 text-primary-foreground/50" /> : <Eye className="h-4 w-4 text-primary-foreground/50" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 font-medium text-gold-foreground shadow-[var(--shadow-gold)] transition hover:brightness-110 disabled:opacity-50">
                {loading ? "Signing in..." : "Access Vault"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-primary-foreground/50">
            <ShieldCheck className="h-4 w-4" />
            Secured by BharatID Identity Network
          </div>
        </div>
      </div>
    </div>
  );
}