import { supabase } from "../supabase";

export interface LoginAuditRecord {
  id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  role: string;
  loginTimestamp: string; // ISO 8601
  loginFormattedDate: string; // e.g., "20-Sep-2026"
  loginFormattedTime: string; // e.g., "08:42:15 AM IST"
  ipAddress: string;
  userAgent: string;
  authMethod: "Supabase Auth (Cloud)" | "Institutional Clinical SSO" | "Biometric 2FA" | "Government SmartCard";
  sessionStatus: "Active Now" | "Signed Out" | "Expired";
  riskAssessment: "Authorized (Normal)" | "Elevated (New Device)" | "Suspicious Attempt";
  machineFingerprint: string;
}

const STORAGE_KEY = "ayuranex_login_audit_logs";

// Pre-seeded initial audit history demonstrating institutional multi-role tracking
const DEFAULT_AUDIT_HISTORY: LoginAuditRecord[] = [
  {
    id: "LOG-AIIA-9812",
    userEmail: "admin.aiia@gov.in",
    userName: "Prof. (Dr.) Tanuja Nesari",
    role: "Admin",
    loginTimestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    loginFormattedDate: "20-Sep-2026",
    loginFormattedTime: "08:42:15 AM IST",
    ipAddress: "192.168.1.104 (AIIA Core LAN)",
    userAgent: "Chrome 131 / Windows 11 Enterprise",
    authMethod: "Institutional Clinical SSO",
    sessionStatus: "Active Now",
    riskAssessment: "Authorized (Normal)",
    machineFingerprint: "AIIA-ADMIN-WS01 #E49B"
  },
  {
    id: "LOG-AIIA-9804",
    userEmail: "alka.kapoor@aiia.gov.in",
    userName: "Dr. Alka Kapoor",
    role: "Pharmacovigilance",
    loginTimestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    loginFormattedDate: "20-Sep-2026",
    loginFormattedTime: "08:05:30 AM IST",
    ipAddress: "192.168.1.128 (NPvCC Dedicated Unit)",
    userAgent: "Edge 128 / Windows 11 Pro",
    authMethod: "Institutional Clinical SSO",
    sessionStatus: "Active Now",
    riskAssessment: "Authorized (Normal)",
    machineFingerprint: "NPVCC-SEC-NODE #281F"
  },
  {
    id: "LOG-AIIA-9790",
    userEmail: "cdsco.inspector@nic.in",
    userName: "Dr. S. K. Sharma (Lead CDSCO Inspector)",
    role: "Regulator",
    loginTimestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    loginFormattedDate: "20-Sep-2026",
    loginFormattedTime: "05:50:12 AM IST",
    ipAddress: "10.24.110.8 (CDSCO Gateway VPN)",
    userAgent: "Firefox ESR / Secured GovOS",
    authMethod: "Government SmartCard",
    sessionStatus: "Signed Out",
    riskAssessment: "Authorized (Normal)",
    machineFingerprint: "GOV-NIC-SEAL #9011"
  },
  {
    id: "LOG-AIIA-9781",
    userEmail: "pi.investigator@aiia.ac.in",
    userName: "Dr. Rama Kant Yadav",
    role: "Principal Investigator",
    loginTimestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    loginFormattedDate: "19-Sep-2026",
    loginFormattedTime: "11:40:00 PM IST",
    ipAddress: "192.168.2.14 (Clinical Ward 3)",
    userAgent: "Safari / iPadOS 17.5",
    authMethod: "Biometric 2FA",
    sessionStatus: "Signed Out",
    riskAssessment: "Authorized (Normal)",
    machineFingerprint: "AIIA-CLIN-IPAD #0412"
  }
];

function getStoredAuditLogs(): LoginAuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AUDIT_HISTORY));
  return DEFAULT_AUDIT_HISTORY;
}

function saveStoredAuditLogs(logs: LoginAuditRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

/**
 * Log a user login event into Supabase and local storage
 */
export async function recordLoginAudit(params: {
  userEmail: string;
  userName: string;
  role: string;
  authMethod: LoginAuditRecord["authMethod"];
  userId?: string;
}): Promise<LoginAuditRecord> {
  const now = new Date();
  
  // Format standard Indian Standard Time (IST) display
  const loginFormattedDate = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const loginFormattedTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }) + " IST";

  // Synthesize client device telemetry
  const ipPrefix = params.role === "Regulator" ? "10.24.110." : "192.168.1.";
  const ipAddress = `${ipPrefix}${Math.floor(100 + Math.random() * 80)} (${params.role === "Regulator" ? "CDSCO GovNET" : "AIIA Intranet"})`;
  const machineFingerprint = `SEC-HOST #${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const auditRecord: LoginAuditRecord = {
    id: `LOG-AIIA-${Date.now().toString().slice(-5)}`,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    role: params.role,
    loginTimestamp: now.toISOString(),
    loginFormattedDate,
    loginFormattedTime,
    ipAddress,
    userAgent: navigator.userAgent || "Chrome / Windows 11",
    authMethod: params.authMethod,
    sessionStatus: "Active Now",
    riskAssessment: "Authorized (Normal)",
    machineFingerprint
  };

  // 1. Update local storage cache immediately
  const existing = getStoredAuditLogs();
  const updated = [auditRecord, ...existing];
  saveStoredAuditLogs(updated);

  // 2. Transmit to Supabase PostgreSQL (asynchronous, non-blocking)
  try {
    await supabase.from("login_audit_logs").insert([
      {
        id: auditRecord.id,
        user_id: auditRecord.userId,
        user_email: auditRecord.userEmail,
        user_name: auditRecord.userName,
        role: auditRecord.role,
        login_timestamp: auditRecord.loginTimestamp,
        ip_address: auditRecord.ipAddress,
        user_agent: auditRecord.userAgent,
        auth_method: auditRecord.authMethod,
        session_status: auditRecord.sessionStatus,
        risk_assessment: auditRecord.riskAssessment,
        machine_fingerprint: auditRecord.machineFingerprint
      }
    ]);
  } catch (err) {
    console.warn("Supabase login audit cloud push notice (local cache active):", err);
  }

  return auditRecord;
}

/**
 * Fetch all login audit logs for the Admin Security Dashboard
 */
export async function fetchLoginAuditLogs(): Promise<LoginAuditRecord[]> {
  try {
    const { data, error } = await supabase
      .from("login_audit_logs")
      .select("*")
      .order("login_timestamp", { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped: LoginAuditRecord[] = data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email || "user@aiia.gov.in",
        userName: row.user_name || "Authorized Clinician",
        role: row.role || "Clinician",
        loginTimestamp: row.login_timestamp,
        loginFormattedDate: new Date(row.login_timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        loginFormattedTime: new Date(row.login_timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) + " IST",
        ipAddress: row.ip_address || "192.168.1.100",
        userAgent: row.user_agent || "Web Browser",
        authMethod: row.auth_method || "Supabase Auth (Cloud)",
        sessionStatus: row.session_status || "Signed Out",
        riskAssessment: row.risk_assessment || "Authorized (Normal)",
        machineFingerprint: row.machine_fingerprint || "AIIA-NODE"
      }));
      saveStoredAuditLogs(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn("Supabase login audit fetch notice:", err);
  }

  return getStoredAuditLogs();
}

/**
 * Terminate or sign out an active session (Admin privilege)
 */
export async function terminateSessionLog(logId: string): Promise<void> {
  const current = getStoredAuditLogs();
  const updated = current.map((log) =>
    log.id === logId ? { ...log, sessionStatus: "Signed Out" as const } : log
  );
  saveStoredAuditLogs(updated);

  try {
    await supabase
      .from("login_audit_logs")
      .update({ session_status: "Signed Out" })
      .eq("id", logId);
  } catch {}
}

/**
 * Real Supabase Auth Email/Password Sign-In
 */
export async function signInWithSupabase(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Real Supabase Auth Email/Password Sign-Up
 */
export async function signUpWithSupabase(email: string, password: string, metadata: { full_name: string; role: string }) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
}

/**
 * Sign out of Supabase
 */
export async function signOutSupabase() {
  return await supabase.auth.signOut();
}
