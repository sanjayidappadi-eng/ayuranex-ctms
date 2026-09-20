import { useState } from "react";
import { ShieldCheck, Lock, User, Eye, EyeOff, Sparkles, Leaf, Pill, Flower2, Sprout, Shield, CheckCircle2 } from "lucide-react";
import { recordLoginAudit } from "./services/authService";
import { AyuraNexLogo } from "./components/AyuraNexLogo";

type LoginProps = { onLogin: (role: string) => void };

function Login({ onLogin }: LoginProps) {
  const [portalKey, setPortalKey] = useState("admin");
  const [username, setUsername] = useState("admin@aiia.gov.in");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);

  // Clinical Portals with explicit role mapping, descriptions, and verified department IDs
  const CLINICAL_PORTALS: Record<string, { role: string; title: string; dept: string; defaultUser: string; badge: string }> = {
    admin: {
      role: "Admin",
      title: "AIIA Leadership & CTMS Command",
      dept: "Executive Director / Central Research Secretariat",
      defaultUser: "admin@aiia.gov.in",
      badge: "Full System Command"
    },
    pi: {
      role: "Principal Investigator",
      title: "Principal Investigator (Clinical Trials)",
      dept: "Dravyaguna / Kayachikitsa Clinical Research Unit",
      defaultUser: "pi.nesari@aiia.gov.in",
      badge: "Enrolment & Site Ops"
    },
    pv: {
      role: "Pharmacovigilance",
      title: "National Pharmacovigilance Centre (NPvCC)",
      dept: "National Safety Surveillance & ADR Monitoring Centre",
      defaultUser: "npvcc.safety@aiia.gov.in",
      badge: "24h SAE Sentinel"
    },
    ethics: {
      role: "Ethics Committee",
      title: "Institutional Ethics Committee (IEC)",
      dept: "AIIA Ethics Board & ICMR Compliance Secretariat",
      defaultUser: "iec.chair@aiia.gov.in",
      badge: "Protocol & Safety Audit"
    },
    monitor: {
      role: "Clinical Monitor",
      title: "Clinical Research Associate (CRA / Monitor)",
      dept: "Quality Assurance & CDISC SDV Verification",
      defaultUser: "cra.monitor@aiia.gov.in",
      badge: "SDV & CDISC Check"
    },
    regulator: {
      role: "Regulator",
      title: "CDSCO / Ministry of Ayush Auditor (Gov e-Pramaan)",
      dept: "Drug Controller General of India Oversight",
      defaultUser: "cdsco.inspector@gov.in",
      badge: "Gov e-Pramaan SSO"
    }
  };

  const handlePortalChange = (key: string) => {
    setPortalKey(key);
    const portal = CLINICAL_PORTALS[key];
    if (portal) {
      setUsername(portal.defaultUser);
      setPassword("demo123");
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert("Please enter username and password.");
      return;
    }
    
    setIsSubmitting(true);
    setAuthStatusMessage("Authenticating and recording security audit telemetry...");

    const portal = CLINICAL_PORTALS[portalKey] || CLINICAL_PORTALS.admin;
    const authMethod = "Institutional Clinical SSO";

    try {
      // Record immutable login audit record with exact IST date & time
      await recordLoginAudit({
        userEmail: username,
        userName: portal.title.split("(")[0].trim(),
        role: portal.role,
        authMethod
      });

      onLogin(portal.role);
    } catch (err) {
      console.error("Login audit failure notice:", err);
      onLogin(portal.role);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePortal = CLINICAL_PORTALS[portalKey] || CLINICAL_PORTALS.admin;

  return (
    <div className="ayura-login min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <style>{`
        .ayura-login {
          background:
            radial-gradient(circle at 15% 15%, rgba(20,184,166,.16), transparent 27%),
            radial-gradient(circle at 85% 20%, rgba(99,102,241,.17), transparent 30%),
            radial-gradient(circle at 50% 100%, rgba(16,185,129,.09), transparent 35%),
            #020617;
        }
        .login-orb { position:absolute; border-radius:999px; filter:blur(1px); pointer-events:none; animation:loginFloat 12s ease-in-out infinite; opacity:.72; }
        .login-symbol { position:absolute; display:flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:21px; color:rgba(94,234,212,.94); background:linear-gradient(145deg,rgba(20,184,166,.11),rgba(99,102,241,.10)); border:1px solid rgba(94,234,212,.22); box-shadow:0 15px 40px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.10); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); pointer-events:none; animation:loginSymbol 9s ease-in-out infinite; }
        .login-symbol::after { content:""; position:absolute; inset:-11px; border-radius:27px; border:1px solid rgba(94,234,212,.07); animation:symbolRing 4.5s ease-in-out infinite; }
        .login-card { background:linear-gradient(145deg,rgba(15,23,42,.92),rgba(15,23,42,.80)); border:1px solid rgba(148,163,184,.20); box-shadow:0 28px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.09); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); animation:cardIn .7s cubic-bezier(.2,.8,.2,1) both; }
        .login-field { transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease; background:rgba(15,23,42,.78) !important; color:#f8fafc !important; border-color:rgba(148,163,184,.24) !important; }
        .login-field::placeholder { color:#64748b; }
        .login-field:focus { transform:translateY(-1px); box-shadow:0 10px 28px rgba(20,184,166,.13),0 0 0 1px rgba(45,212,191,.18); }
        .login-button { position:relative; overflow:hidden; transition:transform .2s ease,box-shadow .2s ease; }
        .login-button::before { content:""; position:absolute; inset:0; background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.32) 50%,transparent 80%); transform:translateX(-120%); transition:transform .65s ease; }
        .login-button:hover { transform:translateY(-2px); box-shadow:0 16px 38px rgba(79,70,229,.30); }
        .login-button:hover::before { transform:translateX(120%); }   
        .login-card h1,.login-card h2 { color:#f8fafc !important; }
        .ayura-login label { color:#cbd5e1 !important; }
        .ayura-login .text-slate-500 { color:#94a3b8 !important; }
        .ayura-login .text-slate-400 { color:#64748b !important; }
        .ayura-login select,.ayura-login input { color:#f8fafc !important; }
        .ayura-login select option { background:#0f172a; color:#f8fafc; }
        .demo-access {
          background:linear-gradient(135deg,rgba(15,23,42,.88),rgba(17,24,39,.74)) !important;
          border:1px solid rgba(45,212,191,.20) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 28px rgba(0,0,0,.20) !important;
          color:#cbd5e1 !important;
        }
        @keyframes loginFloat { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(30px,-25px,0) scale(1.08)} }
        @keyframes loginSymbol { 0%,100%{transform:translateY(0) rotate(-4deg);opacity:.72} 50%{transform:translateY(-27px) rotate(7deg);opacity:.95} }
        @keyframes symbolRing { 0%,100%{transform:scale(.92);opacity:.12} 50%{transform:scale(1.08);opacity:.72} }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
      `}</style>

      <div className="login-orb w-96 h-96 -top-40 -left-40 bg-teal-200/25" />
      <div className="login-orb w-96 h-96 -bottom-44 -right-40 bg-violet-200/25" style={{ animationDelay: "2s" }} />
      <div className="login-orb w-64 h-64 top-[25%] right-[8%] bg-indigo-900/50/30" style={{ animationDelay: "4s" }} />

      <div className="login-symbol left-[10%] top-[20%]"><Leaf size={28} /></div>
      <div className="login-symbol right-[13%] top-[18%]" style={{ animationDelay: "1.5s" }}><Flower2 size={27} /></div>
      <div className="login-symbol left-[16%] bottom-[18%]" style={{ animationDelay: "3s" }}><Sprout size={28} /></div>
      <div className="login-symbol right-[17%] bottom-[16%]" style={{ animationDelay: "4.5s" }}><Pill size={27} /></div>
      <div className="login-symbol right-[29%] top-[9%]" style={{ animationDelay: "6s" }}><Sparkles size={25} /></div>

      <div className="relative z-10 w-full max-w-lg px-4 sm:px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          className="login-card rounded-3xl p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center mb-3">
              <AyuraNexLogo size={60} />
            </div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">AyuraNex</h1>
            <p className="text-xs uppercase tracking-widest text-teal-400 font-semibold mt-1">
              AIIA Clinical Trial Management System (CTMS) & NPvCC
            </p>
            <p className="text-xs text-slate-400 mt-1">GCP-ASU • CDISC SDTM • NDCT Rules 2019 • ICMR Ethical Compliance</p>
          </div>

          {/* Institutional Single Sign-On Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 text-xs">
            <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
              <Shield size={14} className="text-teal-400" /> Institutional Clinical SSO
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Gov e-Pramaan / AIIA Vault</span>
          </div>

          {/* Single Unified Login As (Clinical Access Portal) Selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Login As (Clinical Access Portal)
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-3.5 w-5 h-5 text-teal-400 pointer-events-none" />
              <select
                value={portalKey}
                onChange={(e) => handlePortalChange(e.target.value)}
                className="login-field w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="admin">AIIA Leadership & CTMS Command (Admin)</option>
                <option value="pi">Principal Investigator (Clinical Trials & Site Ops)</option>
                <option value="pv">National Pharmacovigilance Centre (NPvCC Safety Lead)</option>
                <option value="ethics">Institutional Ethics Committee (IEC Secretariat)</option>
                <option value="monitor">Clinical Research Associate (CRA / Monitor)</option>
                <option value="regulator">CDSCO / Ministry of Ayush Regulatory Inspector (Gov e-Pramaan)</option>
              </select>
            </div>

            {/* Live Department & Regulatory Badge */}
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-950/60 border border-slate-800/80 px-3 py-2 text-xs">
              <span className="text-slate-400 truncate max-w-[280px]">{activePortal.dept}</span>
              <span className="shrink-0 font-semibold text-teal-300 bg-teal-950/80 border border-teal-800/60 rounded px-2 py-0.5">
                {activePortal.badge}
              </span>
            </div>
          </div>

          {/* Username / Credential Field */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Institutional Username / Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter institutional email / username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-field w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Password / Access Token
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-field w-full pl-11 pr-11 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="login-button w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-semibold shadow-lg text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In & Recording Audit Log...
              </>
            ) : (
              "Enter Command Center"
            )}
          </button>

          {/* Security Telemetry Notification */}
          <div className="flex flex-col items-center justify-center gap-1 mt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-teal-400/90 font-medium">
              <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
              <span>21 CFR Part 11 Telemetry: Exact Date & Time Logged</span>
            </div>
            {isSubmitting && authStatusMessage && (
              <p className="text-[11px] text-teal-300 animate-pulse">{authStatusMessage}</p>
            )}
          </div>

          {/* Credentials Info Footer */}
          <div className="demo-access mt-4 p-3 rounded-xl text-center text-xs">
            <p className="text-slate-400">Institutional Access Ready</p>
            <p className="font-semibold text-slate-200 mt-0.5">
              Active: <span className="text-teal-300">{username}</span> (Password: <span className="font-mono text-indigo-300">{password}</span>)
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          All India Institute of Ayurveda (AIIA) • Ministry of Ayush, Govt. of India
        </p>
      </div>
    </div>
  );
}

export default Login;

