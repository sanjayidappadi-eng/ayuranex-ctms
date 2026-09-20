import { OFFICIAL_AIIA_TRIALS } from "../data/clinicalDataset";

interface Props {
  role: string;
  onNavigate: (page: string) => void;
  onSelectSae?: () => void;
}

export default function RoleViews({ role, onNavigate, onSelectSae }: Props) {
  // 1. Principal Investigator (PI) View
  if (role === "Principal Investigator") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Investigator Dashboard</span>
              <h2 className="text-2xl font-bold text-white mt-1">Study Site Operations & Patient Management</h2>
              <p className="text-sm text-slate-400 mt-1">Active Trials: 2 • Enrolled Subjects: 232 • e-Signatures Pending: 3</p>
            </div>
            <button
              onClick={() => onNavigate("Recruitment")}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Manage Enrolments
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Site Recruitment Target</span>
            <p className="mt-2 text-3xl font-extrabold text-teal-400">81.6%</p>
            <p className="text-xs text-slate-400 mt-1">98 / 120 subjects randomized in Ashwagandha MCI Trial</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Visit Protocol Compliance</span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">96.4%</p>
            <p className="text-xs text-slate-400 mt-1">Scheduled Week 12 visits completed on time</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Safety Alerts on My Studies</span>
            <p className="mt-2 text-3xl font-extrabold text-amber-400">1 Mild AE</p>
            <p className="text-xs text-slate-400 mt-1">Zero unresolved SAEs on active investigative arm</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Ethics Committee (IEC) View
  if (role === "Ethics Committee") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-teal-500/30 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Ethics Committee Oversight</span>
              <h2 className="text-2xl font-bold text-white mt-1">Institutional Ethics Committee (IEC) Command</h2>
              <p className="text-sm text-slate-400 mt-1">ICMR 2017 & GCP-ASU Compliance Review • Next Full Board: 28-Sep-2026</p>
            </div>
            <button
              onClick={() => onNavigate("Regulatory & CTRI")}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
            >
              Review Protocol Dossiers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Continuing Reviews Due</span>
            <p className="mt-2 text-3xl font-extrabold text-teal-400">1 Trial</p>
            <p className="text-xs text-slate-400 mt-1">Annual review due for Guduchi Metabolic study</p>
          </div>

          <div
            onClick={() => onSelectSae ? onSelectSae() : onNavigate("Pharmacovigilance (NPvCC)")}
            className="rounded-xl border border-red-800/70 bg-slate-900 p-5 cursor-pointer hover:border-red-500 hover:bg-red-950/20 transition group"
            title="Click to identify affected trial and patient"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-red-400">24-Hour SAE Notifications</span>
              <span className="text-[10px] uppercase font-bold text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded group-hover:bg-red-800 transition">View Details →</span>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-red-400">1 Pending Review</p>
            <p className="text-xs text-red-300/80 mt-1">Expedited notification received from Ayush-64 trial (CTRI/2023/02/049812)</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">e-Consent Audio-Visual Audit</span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">100% Verified</p>
            <p className="text-xs text-slate-400 mt-1">DPDP Act 2023 compliant consent logs vaulted</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Clinical Monitor / CRA View
  if (role === "Clinical Monitor") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Monitoring & Quality Assurance</span>
              <h2 className="text-2xl font-bold text-white mt-1">Source Data Verification (SDV) & Site Monitoring</h2>
              <p className="text-sm text-slate-400 mt-1">Multi-site GCP-ASU compliance tracking across AIIA clinical centers</p>
            </div>
            <button
              onClick={() => onNavigate("CDISC Standards")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Verify CDISC SDTM Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Source Data Verification</span>
            <p className="mt-2 text-3xl font-extrabold text-blue-400">92.4%</p>
            <p className="text-xs text-slate-400 mt-1">eCRF data cross-verified against hospital EMR</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Protocol Deviations</span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-400">Zero Major</p>
            <p className="text-xs text-slate-400 mt-1">2 minor visit window extensions logged with CAPA</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">Drug Accountability</span>
            <p className="mt-2 text-3xl font-extrabold text-teal-400">Reconciled</p>
            <p className="text-xs text-slate-400 mt-1">Formulation batch logs match dispensed units</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pharmacovigilance View
  if (role === "Pharmacovigilance") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-500/30 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">NPvCC Surveillance</span>
              <h2 className="text-2xl font-bold text-white mt-1">National Pharmacovigilance Coordination Center</h2>
              <p className="text-sm text-slate-400 mt-1">Real-time signal detection, MedDRA auto-coder, and expedited reporting desk</p>
            </div>
            <button
              onClick={() => onNavigate("Pharmacovigilance (NPvCC)")}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Open Regulatory Clock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => onSelectSae ? onSelectSae() : onNavigate("Pharmacovigilance (NPvCC)")}
            className="rounded-xl border border-red-800/70 bg-slate-900 p-5 cursor-pointer hover:border-red-500 hover:bg-red-950/20 transition group"
            title="Click to view urgent SAE alert details"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-red-400">24h Expedited Deadline</span>
              <span className="text-[10px] uppercase font-bold text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded group-hover:bg-red-800 transition">View Details →</span>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-red-400">Active Alert</p>
            <p className="text-xs text-red-300/80 mt-1">1 SAE: Ayush-64 (CTRI/2023/02/049812) • Patient AIIA-049812-SITE01-029</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">MedDRA Coding Conformance</span>
            <p className="mt-2 text-3xl font-extrabold text-teal-400">100%</p>
            <p className="text-xs text-slate-400 mt-1">All events mapped to SOC and Preferred Terms</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <span className="text-xs font-bold uppercase text-slate-400">WHO-UMC Causality Queue</span>
            <p className="mt-2 text-3xl font-extrabold text-indigo-300">Updated</p>
            <p className="text-xs text-slate-400 mt-1">Causality algorithm applied to all reported ADRs</p>
          </div>
        </div>
      </div>
    );
  }

  // Default: Institutional Leadership / Ministry / Admin View
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Institutional Leadership & Ministry of Ayush</span>
            <h2 className="text-2xl font-bold text-white mt-1">AIIA Clinical Trials Executive Command</h2>
            <p className="text-sm text-slate-400 mt-1">High-level research portfolio performance, regulatory adherence, and safety health</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate("Pharmacovigilance (NPvCC)")}
              className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-500"
            >
              Safety Alerts
            </button>
            <button
              onClick={() => onNavigate("CDISC Standards")}
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              CDISC Submission
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <span className="text-xs font-bold uppercase text-slate-400">Total Clinical Portfolio</span>
          <p className="mt-2 text-3xl font-extrabold text-white">{OFFICIAL_AIIA_TRIALS.length} Studies</p>
          <p className="text-xs text-indigo-300 mt-1">100% Prospective CTRI Registered</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <span className="text-xs font-bold uppercase text-slate-400">Total Enrolled Subjects</span>
          <p className="mt-2 text-3xl font-extrabold text-teal-400">
            {OFFICIAL_AIIA_TRIALS.reduce((acc, t) => acc + t.enrolled, 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Across 4 major multi-centre sites</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <span className="text-xs font-bold uppercase text-slate-400">Regulatory Compliance Index</span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">99.2%</p>
          <p className="text-xs text-slate-400 mt-1">NDCT Rules 2019 & GCP-ASU compliant</p>
        </div>

        <div
          onClick={() => onSelectSae ? onSelectSae() : onNavigate("Pharmacovigilance (NPvCC)")}
          className="rounded-xl border border-red-800/80 bg-red-950/25 p-5 cursor-pointer hover:border-red-500 hover:bg-red-950/40 transition group shadow-lg"
          title="Click to identify trial CTRI/2023/02/049812 and affected patient AIIA-049812-SITE01-029"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-400">NPvCC Surveillance Status</span>
            <span className="text-[10px] uppercase font-bold text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded group-hover:bg-red-800 transition">Action Alert →</span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-red-400">1 Urgent SAE</p>
          <p className="text-xs text-red-300/80 mt-1">Trial: CTRI/2023/02/049812 • Patient: AIIA-049812-SITE01-029</p>
        </div>
      </div>
    </div>
  );
}
