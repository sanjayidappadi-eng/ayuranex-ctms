import { useEffect, useMemo, useState } from "react";
import Login from "./Login";
import { supabase } from "./supabase";
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  ShieldAlert,
  TriangleAlert,
  BarChart3,
  FileText,
  LogOut,
  Plus,
  Download,
  Save,
  X,
  Leaf,
  Pill,
  Flower2,
  Sprout,
  Sparkles,
  ShieldCheck,
  Database,
  Share2,
  FileCheck2,
} from "lucide-react";
import PharmacovigilanceNPvCC from "./modules/PharmacovigilanceNPvCC";
import CDISCCenter from "./modules/CDISCCenter";
import FHIRGateway from "./modules/FHIRGateway";
import ALCOAAuditTrail from "./modules/ALCOAAuditTrail";
import RegulatoryEngine from "./modules/RegulatoryEngine";
import RoleViews from "./modules/RoleViews";
import AdminSecurityAudit from "./modules/AdminSecurityAudit";
import { CDISC_SDTM_SUBJECTS } from "./data/clinicalDataset";
import {
  downloadPatientReportPdf,
  downloadPatientHealthHistoryPdf,
  downloadAllPatientReportsPdf
} from "./utils/pdfGenerator";
import { AyuraNexLogo } from "./components/AyuraNexLogo";

function computeAutoStudyPhase(trial: { targetPatients?: number; enrolled?: number }): string {
  const target = trial.targetPatients || 1;
  const ratio = (trial.enrolled || 0) / target;
  if (ratio >= 1.0) {
    return "Phase IV (Post-Marketing / Surveillance)";
  } else if (ratio >= 0.5) {
    return "Phase III (Pivotal Confirmatory Trial)";
  } else if (ratio >= 0.15) {
    return "Phase II (Therapeutic Efficacy & Dose Staging)";
  } else {
    return "Phase I (Safety & Clinical Tolerability)";
  }
}

type Trial = {
  id?: number;
  created_at?: string;
  trialId: string;
  studyName: string;
  investigator: string;
  targetPatients: number;
  enrolled: number;
  status: string;
  systemOfMedicine: string;
  studyFocus: string;
  studyMethod: string;
  studyType?: string;
  phase?: string;
  intervention?: string;
  sponsor?: string;
  recruitmentStatus?: string;
};

type Participant = {
  id: string;
  trialId: string;
  age: number;
  sex: string;
  enrollmentDate: string;
  site: string;
  consent: string;
  treatmentArm: string;
  baselineCondition: string;
  presentingComplaint: string;
  diagnosis: string;
  diseaseDuration: string;
  currentSymptoms: string;
  priorTreatment: string;
  familyHistory: string;
  lifestyleFactors: string;
  prakriti: string;
  doshaAssessment: string;
  medicalHistory: string;
  allergies: string;
  concomitantMedication: string;
  baselineVitals: string;
  labSummary: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
  visitSchedule: string;
  adherence: string;
  followUpStatus: string;
  outcomeNotes: string;
  notes: string;
  createdAt: string;
  abhaId?: string;
  vitalSigns?: { sysbp: number; diabp: number; pulse: number; temp: number; respRate?: number; bmi: number };
  safetyLabMetrics?: { sgot: number; sgpt: number; creatinine: number; bilirubin: number; fbs: number; hba1c: number };
  doshaScore?: { vata: number; pitta: number; kapha: number };
};

type SafetyEvent = {
  id: string;
  trialId: string;
  participantId: string;
  type: string;
  event: string;
  severity: string;
  onsetDate: string;
  status: string;
  suspectedMedicine: string;
  causality: string;
  actionTaken: string;
  outcome: string;
  seriousnessCriteria: string;
};

type ComplianceItem = {
  id: string;
  trialId: string;
  item: string;
  dueDate: string;
  status: string;
};

type ActionItem = {
  id: string;
  trialId: string;
  action: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: string;
};




declare global {
  interface Window {
    XLSX?: any;
    showSaveFilePicker?: (options?: any) => Promise<any>;
  }
}

const toNonNegativeNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
};

const normalizeTrial = (trial: any): Trial => ({
  id: trial.id,
  created_at: trial.created_at,
  trialId: String(trial.trialId ?? trial.trial_id ?? ""),
  studyName: String(trial.studyName ?? trial.study_name ?? ""),
  investigator: String(trial.investigator ?? ""),
  targetPatients: toNonNegativeNumber(
    trial.targetPatients ?? trial.target_patients
  ),
  enrolled: toNonNegativeNumber(trial.enrolled),
  status:
    toNonNegativeNumber(trial.enrolled) >=
    toNonNegativeNumber(trial.targetPatients) &&
    toNonNegativeNumber(trial.targetPatients) > 0
      ? "Completed"
      : String(trial.status ?? "Active"),
  systemOfMedicine: String(trial.systemOfMedicine ?? trial.system_of_medicine ?? "Ayurveda"),
  studyFocus: String(trial.studyFocus ?? trial.study_focus ?? DEFAULT_FOCUS),
  studyMethod: String(trial.studyMethod ?? trial.study_method ?? DEFAULT_METHOD),
  studyType: String(trial.studyType ?? trial.study_type ?? "Interventional"),
  phase: String(trial.phase ?? "Not Applicable"),
  intervention: String(trial.intervention ?? ""),
  sponsor: String(trial.sponsor ?? ""),
  recruitmentStatus: String(trial.recruitmentStatus ?? trial.recruitment_status ?? "Recruiting"),
});

const STUDY_FOCUS_BY_MEDICINE: Record<string, string[]> = {
  Ayurveda: ["Therapeutic efficacy", "Safety / tolerability", "Herbal formulation evaluation", "Panchakarma intervention", "Comparative effectiveness", "Chronic disease management", "Preventive / lifestyle intervention", "Integrative care"],
  Siddha: ["Therapeutic efficacy", "Safety / tolerability", "Herbal / mineral formulation evaluation", "Traditional intervention evaluation", "Comparative effectiveness", "Chronic disease management", "Preventive / lifestyle intervention"],
  Unani: ["Therapeutic efficacy", "Safety / tolerability", "Formulation evaluation", "Regimen / intervention evaluation", "Comparative effectiveness", "Chronic disease management", "Preventive intervention"],
  "Yoga & Naturopathy": ["Therapeutic efficacy", "Stress / wellbeing intervention", "Lifestyle intervention", "Chronic disease management", "Preventive intervention", "Comparative effectiveness"],
  "Sowa-Rigpa": ["Therapeutic efficacy", "Safety / tolerability", "Formulation evaluation", "Traditional intervention evaluation", "Comparative effectiveness"],
  Homoeopathy: ["Therapeutic efficacy", "Safety / tolerability", "Symptom management", "Comparative effectiveness", "Preventive intervention"]
};

const STUDY_METHODS_BY_FOCUS: Record<string, string[]> = {
  "Therapeutic efficacy": ["Randomized Controlled Trial", "Non-Randomized Clinical Trial", "Single-Arm Interventional Study", "Comparative Clinical Study"],
  "Safety / tolerability": ["Prospective Safety Study", "Single-Arm Interventional Study", "Observational Study"],
  "Herbal formulation evaluation": ["Randomized Controlled Trial", "Comparative Clinical Study", "Single-Arm Interventional Study"],
  "Herbal / mineral formulation evaluation": ["Randomized Controlled Trial", "Comparative Clinical Study", "Single-Arm Interventional Study"],
  "Formulation evaluation": ["Randomized Controlled Trial", "Comparative Clinical Study", "Single-Arm Interventional Study"],
  "Panchakarma intervention": ["Prospective Interventional Study", "Comparative Clinical Study", "Randomized Controlled Trial"],
  "Traditional intervention evaluation": ["Prospective Interventional Study", "Comparative Clinical Study", "Randomized Controlled Trial"],
  "Regimen / intervention evaluation": ["Prospective Interventional Study", "Comparative Clinical Study", "Randomized Controlled Trial"],
  "Comparative effectiveness": ["Randomized Controlled Trial", "Comparative Clinical Study", "Non-Randomized Clinical Trial"],
  "Chronic disease management": ["Randomized Controlled Trial", "Prospective Interventional Study", "Prospective Observational Study", "Comparative Clinical Study"],
  "Preventive / lifestyle intervention": ["Randomized Controlled Trial", "Prospective Interventional Study", "Prospective Cohort Study"],
  "Integrative care": ["Comparative Clinical Study", "Randomized Controlled Trial", "Prospective Interventional Study"],
  "Stress / wellbeing intervention": ["Randomized Controlled Trial", "Prospective Interventional Study", "Comparative Clinical Study"],
  "Lifestyle intervention": ["Randomized Controlled Trial", "Prospective Interventional Study", "Prospective Cohort Study"],
  "Preventive intervention": ["Randomized Controlled Trial", "Prospective Interventional Study", "Prospective Cohort Study"],
  "Symptom management": ["Randomized Controlled Trial", "Prospective Clinical Study", "Comparative Clinical Study"]
};
const DEFAULT_FOCUS = "Therapeutic efficacy";
const DEFAULT_METHOD = "Randomized Controlled Trial";
const MEDICINE_OPTIONS = Object.keys(STUDY_FOCUS_BY_MEDICINE);

function RecruitmentBarChart({ trials }: { trials: Trial[] }) {
  const width = 760;
  const height = 330;
  const left = 52;
  const right = 20;
  const top = 28;
  const bottom = 72;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const barGap = trials.length ? 12 : 0;
  const barWidth = trials.length ? Math.max(26, (plotWidth - barGap * (trials.length - 1)) / trials.length) : 30;
  const y = (value: number) => top + plotHeight - (value / 100) * plotHeight;
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px] h-[330px]" role="img" aria-label="Trial-wise recruitment bar chart">
        {[0,25,50,75,100].map((tick) => <g key={tick}><line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} stroke="#24354f" strokeWidth="1"/><text x={left-10} y={y(tick)+4} textAnchor="end" fill="#64748b" fontSize="11">{tick}%</text></g>)}
        <line x1={left} x2={width-right} y1={top+plotHeight} y2={top+plotHeight} stroke="#334155" strokeWidth="1.5"/>
        {trials.map((trial,index)=>{
          const pct=trial.targetPatients>0?Math.round(Math.min((trial.enrolled/trial.targetPatients)*100,100)):0;
          const x=left+index*(barWidth+barGap); const barY=y(pct); const barH=top+plotHeight-barY;
          const fill=pct>=80?"#14b8a6":pct>=50?"#6366f1":pct>0?"#ef4444":"#334155";
          return <g key={trial.trialId}><rect x={x} y={barY} width={barWidth} height={Math.max(barH,2)} rx="7" fill={fill}/><text x={x+barWidth/2} y={Math.max(barY-8,16)} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="700">{pct}%</text><text x={x+barWidth/2} y={top+plotHeight+24} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">{trial.trialId}</text><text x={x+barWidth/2} y={top+plotHeight+42} textAnchor="middle" fill="#64748b" fontSize="9">{trial.enrolled}/{trial.targetPatients}</text></g>;
        })}
      </svg>
    </div>
  );
}

const PROTOTYPE_SAMPLE_TRIALS: Trial[] = [
  {
    trialId: "CTRI/2022/04/041852",
    studyName: "Ashwagandha (Withania somnifera) in Mild Cognitive Impairment",
    investigator: "Prof. (Dr.) Tanuja Nesari",
    targetPatients: 120,
    enrolled: 98,
    status: "Active",
    systemOfMedicine: "Ayurveda",
    studyFocus: "Therapeutic efficacy",
    studyMethod: "Randomized Controlled Trial",
    studyType: "Interventional",
    phase: "Phase III",
    intervention: "Ashwagandha Standardized Extract (300mg BID)",
    sponsor: "All India Institute of Ayurveda (AIIA)",
    recruitmentStatus: "Recruiting"
  },
  {
    trialId: "CTRI/2021/11/038102",
    studyName: "Guduchi Ghanavati (Tinospora cordifolia) in Metabolic Syndrome",
    investigator: "Dr. Rama Kant Yadav",
    targetPatients: 150,
    enrolled: 134,
    status: "Active",
    systemOfMedicine: "Ayurveda",
    studyFocus: "Therapeutic efficacy",
    studyMethod: "Randomized Controlled Trial",
    studyType: "Interventional",
    phase: "Phase II/III",
    intervention: "Guduchi Ghanavati (500mg TID)",
    sponsor: "AIIA Clinical Research Unit",
    recruitmentStatus: "Ongoing"
  },
  {
    trialId: "CTRI/2023/02/049812",
    studyName: "Ayush-64 in Post-Viral Chronic Fatigue & Inflammatory Sequelae",
    investigator: "Dr. Alka Kapoor",
    targetPatients: 200,
    enrolled: 182,
    status: "Active",
    systemOfMedicine: "Ayurveda",
    studyFocus: "Safety / tolerability",
    studyMethod: "Comparative Clinical Study",
    studyType: "Interventional",
    phase: "Phase III",
    intervention: "Ayush-64 Tablets (1000mg BID)",
    sponsor: "AIIA National Pharmacovigilance Centre (NPvCC)",
    recruitmentStatus: "Recruiting"
  },
  {
    trialId: "CTRI/2023/06/054119",
    studyName: "Haridra Khanda Granules vs. Levocetirizine in Allergic Rhinitis",
    investigator: "Dr. Shishir Kumar",
    targetPatients: 80,
    enrolled: 64,
    status: "Active",
    systemOfMedicine: "Ayurveda",
    studyFocus: "Herbal formulation evaluation",
    studyMethod: "Comparative Clinical Study",
    studyType: "Interventional",
    phase: "Phase II",
    intervention: "Haridra Khanda (6g BD with warm milk)",
    sponsor: "AIIA Shalakya Tantra Unit",
    recruitmentStatus: "Recruiting"
  },
  {
    trialId: "CTRI/2022/09/045821",
    studyName: "Virechana Karma (Therapeutic Purgation) in Plaque Psoriasis",
    investigator: "Dr. Santosh Kumar",
    targetPatients: 60,
    enrolled: 52,
    status: "Active",
    systemOfMedicine: "Ayurveda",
    studyFocus: "Panchakarma intervention",
    studyMethod: "Single-Arm Interventional Study",
    studyType: "Interventional",
    phase: "Phase II",
    intervention: "Standardized Virechana Karma Protocol",
    sponsor: "AIIA Panchakarma Division",
    recruitmentStatus: "Ongoing"
  }
];


function App() {
  // Ambient mouse glow only. Card/object drag/tilt is intentionally disabled.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAddTrial, setShowAddTrial] = useState(false);
  const [activePage, setActivePage] = useState("Command Center");
  const [reportTrialId, setReportTrialId] = useState("");
  const [reportPatientId, setReportPatientId] = useState("");
  const [reportsSubTab, setReportsSubTab] = useState<"dossiers" | "analytics">("dossiers");
  const [selectedSafetyPatientId, setSelectedSafetyPatientId] = useState("");
  const [selectedSafetyTrialId, setSelectedSafetyTrialId] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantTrialFilter, setParticipantTrialFilter] = useState("All");

  const [showAttentionPanel, setShowAttentionPanel] = useState(false);
  const [showUrgentSaeModal, setShowUrgentSaeModal] = useState(false);
  const [riskFilter, setRiskFilter] = useState("All");
  const [newTrial, setNewTrial] = useState({
  trialId: "",
  studyName: "",
  investigator: "",
  targetPatients: "",
  enrolled: "",
  systemOfMedicine: "Ayurveda",
  studyFocus: DEFAULT_FOCUS,
  studyMethod: DEFAULT_METHOD,
  studyType: "Interventional",
  phase: "Not Applicable",
  intervention: "",
  sponsor: "",
  recruitmentStatus: "Recruiting",
});
const [trials, setTrials] = useState<Trial[]>([]);

  // User-entered AYUSH study metadata.
  const [trialMeta, setTrialMeta] = useState<Record<string, { systemOfMedicine: string; studyFocus: string; studyMethod: string; studyType: string; phase: string; intervention: string; sponsor: string; recruitmentStatus: string }>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ayuranex_trial_meta") || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch { return {}; }
  });
  useEffect(() => {
    localStorage.setItem("ayuranex_trial_meta", JSON.stringify(trialMeta));
  }, [trialMeta]);

  const [enrollmentOverrides, setEnrollmentOverrides] = useState<Record<string, number>>(() => {
    try { const saved = JSON.parse(localStorage.getItem("ayuranex_enrollment_overrides") || "{}"); return saved && typeof saved === "object" ? saved : {}; } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("ayuranex_enrollment_overrides", JSON.stringify(enrollmentOverrides)); }, [enrollmentOverrides]);

  // Persistent user-created trials from local cache (survives site refresh)
  const [userTrialsState, setUserTrialsState] = useState<Trial[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ayuranex_user_trials") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadTrials = async () => {
      const { data, error } = await supabase
        .from("trials")
        .select("*")
        .order("id");

      if (error) console.warn("Supabase trial load note (using resilient local cache):", error.message);

      const dbTrials = Array.isArray(data)
        ? data.map((row: any) => normalizeTrial(row))
        : [];

      // Combine database trials with local user-saved trials
      const allUserTrials = [...dbTrials];
      userTrialsState.forEach((ut) => {
        if (!allUserTrials.some((dt) => dt.trialId.trim().toUpperCase() === ut.trialId.trim().toUpperCase())) {
          allUserTrials.push(ut);
        }
      });

      // Prototype mode: keep five synthetic/de-identified studies visible in the app
      // so every dashboard module can be demonstrated without entering real patient data.
      const merged = PROTOTYPE_SAMPLE_TRIALS.map((sample) => {
        const existing = allUserTrials.find(
          (t) => t.trialId.trim().toUpperCase() === sample.trialId.trim().toUpperCase()
        );
        return existing ? { ...sample, ...existing } : sample;
      });

      const userTrials = allUserTrials.filter(
        (t) => !PROTOTYPE_SAMPLE_TRIALS.some(
          (sample) => sample.trialId.trim().toUpperCase() === t.trialId.trim().toUpperCase()
        )
      );

      setTrials(
        [...merged, ...userTrials].map((t) => {
          const effectiveEnrolled = Number.isFinite(enrollmentOverrides[t.trialId])
            ? enrollmentOverrides[t.trialId]
            : t.enrolled;
          return {
            ...t,
            ...(trialMeta[t.trialId] || {}),
            enrolled: effectiveEnrolled,
            phase: computeAutoStudyPhase({ targetPatients: t.targetPatients, enrolled: effectiveEnrolled }),
            status:
              effectiveEnrolled >= t.targetPatients && t.targetPatients > 0
                ? "Completed"
                : t.status
          };
        })
      );
    };

    loadTrials();
  }, [trialMeta, enrollmentOverrides, userTrialsState]);
const totalTrials = trials.length;

const activeTrials = trials.filter(
  (trial) => trial.status === "Active"
).length;

const completedTrials = trials.filter(
  (trial) => trial.status === "Completed"
).length;

const attentionTrials = trials.filter((trial) => trial.status === "Attention").length;
const [userRole, setUserRole] = useState("Admin");

  // Authentic CDISC SDTM clinical participant cohort
  const INITIAL_PARTICIPANTS: Participant[] = CDISC_SDTM_SUBJECTS.map((s) => ({
    id: s.usubjid,
    trialId: s.studyId === "AIIA-041852" ? "CTRI/2022/04/041852"
      : s.studyId === "AIIA-038102" ? "CTRI/2021/11/038102"
      : s.studyId === "AIIA-049812" ? "CTRI/2023/02/049812"
      : s.studyId === "AIIA-054119" ? "CTRI/2023/06/054119"
      : s.studyId === "AIIA-045821" ? "CTRI/2022/09/045821"
      : s.studyId,
    age: s.age,
    sex: s.sex === "M" ? "Male" : s.sex === "F" ? "Female" : "Other",
    enrollmentDate: s.rfstdtc,
    site: s.siteName,
    consent: s.consentStatus,
    treatmentArm: s.actarm,
    baselineCondition: s.primaryDiagnosis,
    presentingComplaint: s.presentingComplaints,
    diagnosis: s.primaryDiagnosis,
    diseaseDuration: `${s.diseaseDurationMonths} months`,
    currentSymptoms: s.presentingComplaints,
    priorTreatment: "Conservative Ayurveda Care / Standard Clinical Therapy",
    familyHistory: "Reviewed and documented in patient trial file",
    lifestyleFactors: `Agni: ${s.agni}; Kostha: ${s.kostha}; Dhatu Sarata: ${s.dhatuSarata}`,
    prakriti: s.prakriti,
    doshaAssessment: `Vata: ${s.prakritiDoshaScore.vata}%, Pitta: ${s.prakritiDoshaScore.pitta}%, Kapha: ${s.prakritiDoshaScore.kapha}%`,
    medicalHistory: `${s.primaryDiagnosis} (${s.icd11Code}); NAMASTE: ${s.namasteCode}`,
    allergies: "No known drug allergies reported",
    concomitantMedication: "Documented in concomitant medication log",
    baselineVitals: `BP ${s.baselineVitals.sysbp}/${s.baselineVitals.diabp} mmHg; Pulse ${s.baselineVitals.pulse} bpm; Temp ${s.baselineVitals.temp}°F; BMI ${s.baselineVitals.bmi} kg/m²`,
    labSummary: `FBS ${s.safetyLabs.fbs} mg/dL; HbA1c ${s.safetyLabs.hba1c}%; SGOT ${s.safetyLabs.sgot} U/L; SGPT ${s.safetyLabs.sgpt} U/L; Creatinine ${s.safetyLabs.serumCreatinine} mg/dL; Bilirubin ${s.safetyLabs.totalBilirubin} mg/dL`,
    inclusionCriteria: "Met (Protocol verified)",
    exclusionCriteria: "None (Safety biomarker limits acceptable)",
    visitSchedule: "Baseline; Week 4; Week 8; Week 12; Week 16",
    adherence: `${s.visitScheduleCompliance}% visit adherence`,
    followUpStatus: s.visitStatus,
    outcomeNotes: `ABDM ABHA ID: ${s.abhaId} (${s.abhaAddress}); Consent: ${s.consentType} [${s.consentLanguage}]`,
    notes: `CDISC SDTM Record ${s.usubjid} — Evaluated per GCP-ASU standards`,
    createdAt: s.consentTimestamp,
    abhaId: s.abhaId,
    vitalSigns: s.baselineVitals,
    safetyLabMetrics: {
      sgot: s.safetyLabs.sgot,
      sgpt: s.safetyLabs.sgpt,
      creatinine: s.safetyLabs.serumCreatinine,
      bilirubin: s.safetyLabs.totalBilirubin,
      fbs: s.safetyLabs.fbs,
      hba1c: s.safetyLabs.hba1c,
    },
    doshaScore: s.prakritiDoshaScore,
  }));

  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ayuranex_participants") || "null");
      if (Array.isArray(saved) && saved.length > 0) {
        const canonicalIds = new Set(INITIAL_PARTICIPANTS.map((p) => p.id));
        // Keep only genuine user-created participants, filtering out old non-standard mock duplicates
        const userAdded = saved.filter(
          (p: Participant) =>
            !canonicalIds.has(p.id) &&
            !p.id.startsWith("PT-AYU-") &&
            !p.id.startsWith("PT-SID-") &&
            !p.id.startsWith("PT-YOG-") &&
            !p.id.startsWith("PT-0") &&
            !p.trialId.includes("AYU-S") &&
            p.id.includes("-SITE01-") &&
            p.id !== "AIIA-041852-001" &&
            p.id !== "AIIA-041852-002" &&
            p.id !== "AIIA-038102-001" &&
            p.id !== "AIIA-049812-001"
        );
        const merged = [...INITIAL_PARTICIPANTS, ...userAdded];
        localStorage.setItem("ayuranex_participants", JSON.stringify(merged));
        return merged;
      }
    } catch {}
    localStorage.setItem("ayuranex_participants", JSON.stringify(INITIAL_PARTICIPANTS));
    return INITIAL_PARTICIPANTS;
  });
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantTrialId, setParticipantTrialId] = useState("");
  const emptyParticipant = () => ({
    id: "", age: "", sex: "", enrollmentDate: new Date().toISOString().slice(0,10),
    site: "", consent: "Obtained", treatmentArm: "", baselineCondition: "",
    presentingComplaint: "", diagnosis: "", diseaseDuration: "", currentSymptoms: "", priorTreatment: "", familyHistory: "", lifestyleFactors: "", prakriti: "", doshaAssessment: "",
    medicalHistory: "", allergies: "", concomitantMedication: "", baselineVitals: "",
    labSummary: "", inclusionCriteria: "Met", exclusionCriteria: "None", visitSchedule: "",
    adherence: "Not assessed", followUpStatus: "Pending", outcomeNotes: "", notes: ""
  });
  const [newParticipant, setNewParticipant] = useState(emptyParticipant());

  const PROTOTYPE_SAMPLE_SAFETY_EVENTS: SafetyEvent[] = [
  {
    id: "SAF-S001", trialId: "CTRI/2023/02/049812", participantId: "AIIA-049812-SITE01-029",
    type: "SAE", event: "Angioedema with acute periorbital and facial swelling", severity: "Severe",
    onsetDate: "2026-09-19", status: "Escalated",
    suspectedMedicine: "Ayush-64 Tablets (1000mg BID)",
    causality: "Probable", actionTaken: "Intervention permanently discontinued; IV hydrocortisone & antihistamines administered; 24h regulatory countdown active",
    outcome: "Recovering", seriousnessCriteria: "Hospitalization / Prolonged (DCGI 24h Clock Active)"
  },
  {
    id: "SAF-S002", trialId: "CTRI/2021/11/038102", participantId: "AIIA-038102-SITE01-014",
    type: "ADR", event: "Dyspepsia and mild epigastric warmth",
    severity: "Moderate", onsetDate: "2026-08-22", status: "Under Review",
    suspectedMedicine: "Guduchi Ghanavati (500mg TID)",
    causality: "Possible", actionTaken: "Advised administration with warm water immediately after meals",
    outcome: "Recovered", seriousnessCriteria: "Non-serious"
  },
  {
    id: "SAF-S003", trialId: "CTRI/2022/04/041852", participantId: "AIIA-041852-SITE01-001",
    type: "AE", event: "Transient mild frontal headache",
    severity: "Mild", onsetDate: "2026-05-12", status: "Closed",
    suspectedMedicine: "Ashwagandha Extract (300mg BID)",
    causality: "Unlikely", actionTaken: "No dose modification; resolved spontaneously within 3 hours",
    outcome: "Recovered", seriousnessCriteria: "Non-serious"
  }
];

const [safetyEventsState, setSafetyEventsState] = useState<SafetyEvent[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ayuranex_safety_events") || "null");
      if (Array.isArray(saved) && saved.length > 0) {
        const cleaned = saved.filter(
          (e: SafetyEvent) => !["SAF-001","SAF-002","SAF-003","SAF-004"].includes(e.id) &&
            !e.participantId.startsWith("PT-S00")
        );
        if (cleaned.length > 0) return cleaned;
      }
    } catch {}
    return PROTOTYPE_SAMPLE_SAFETY_EVENTS;
  });
  const [showAddSafety, setShowAddSafety] = useState(false);
  const [newSafety, setNewSafety] = useState({ trialId: "", participantId: "", type: "AE", event: "", severity: "Mild", onsetDate: new Date().toISOString().slice(0,10), status: "Open", suspectedMedicine: "", causality: "Not assessed", actionTaken: "", outcome: "Ongoing", seriousnessCriteria: "" });


  // Small study-linked prototype samples for Compliance and Action Center.
  // Patient data remains synthetic/de-identified; users can add their own records.
  const PROTOTYPE_COMPLIANCE_SAMPLES: ComplianceItem[] = [
    { id: "CMP-S01", trialId: "AYU-001", item: "IEC approval / continuing review", dueDate: "2026-10-05", status: "Upcoming" },
    { id: "CMP-S02", trialId: "AYU-002", item: "CTRI record verification", dueDate: "2026-09-24", status: "Pending" },
    { id: "CMP-S03", trialId: "AYU-003", item: "Safety / SAE documentation review", dueDate: "2026-09-20", status: "Overdue" },
    { id: "CMP-S04", trialId: "AYU-004", item: "Site monitoring visit documentation", dueDate: "2026-10-12", status: "Upcoming" },
    { id: "CMP-S05", trialId: "AYU-005", item: "Trial close-out document readiness", dueDate: "2026-11-01", status: "Pending" },
  ];

  const PROTOTYPE_ACTION_SAMPLES: ActionItem[] = [
    { id: "ACT-S01", trialId: "AYU-001", action: "Review recruitment progress and update site plan", owner: "Clinical Coordinator", dueDate: "2026-09-22", priority: "Medium", status: "Open" },
    { id: "ACT-S02", trialId: "AYU-002", action: "Complete CTRI documentation verification", owner: "Regulatory Lead", dueDate: "2026-09-24", priority: "High", status: "Open" },
    { id: "ACT-S03", trialId: "AYU-003", action: "Review SAE record and document follow-up", owner: "Pharmacovigilance", dueDate: "2026-09-19", priority: "High", status: "Open" },
    { id: "ACT-S04", trialId: "AYU-004", action: "Schedule next monitoring visit and close findings", owner: "Clinical Monitor", dueDate: "2026-10-10", priority: "Medium", status: "Open" },
    { id: "ACT-S05", trialId: "AYU-005", action: "Prepare close-out checklist for investigator review", owner: "Principal Investigator", dueDate: "2026-10-28", priority: "Low", status: "Open" },
  ];

  const [complianceState, setComplianceState] = useState<ComplianceItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ayuranex_compliance") || "null");
      if (Array.isArray(saved)) {
        const cleaned = saved.filter((c: ComplianceItem) => !["CMP-001","CMP-002","CMP-003","CMP-004"].includes(c.id));
        const existingIds = new Set(cleaned.map((c: ComplianceItem) => c.id));
        return [...PROTOTYPE_COMPLIANCE_SAMPLES.filter((c) => !existingIds.has(c.id)), ...cleaned];
      }
    } catch {}
    return PROTOTYPE_COMPLIANCE_SAMPLES;
  });
  const [showAddCompliance, setShowAddCompliance] = useState(false);
  const [newCompliance, setNewCompliance] = useState({ trialId: "", item: "", dueDate: new Date().toISOString().slice(0,10), status: "Upcoming" });

  const [actionState, setActionState] = useState<ActionItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ayuranex_actions") || "null");
      if (Array.isArray(saved)) {
        const cleaned = saved.filter((a: ActionItem) => !["ACT-001","ACT-002","ACT-003"].includes(a.id));
        const existingIds = new Set(cleaned.map((a: ActionItem) => a.id));
        return [...PROTOTYPE_ACTION_SAMPLES.filter((a) => !existingIds.has(a.id)), ...cleaned];
      }
    } catch {}
    return PROTOTYPE_ACTION_SAMPLES;
  });
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState({ trialId: "", action: "", owner: "Investigator", dueDate: new Date().toISOString().slice(0,10), priority: "Medium", status: "Open" });

  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; actor: string; action: string; trialId: string; timestamp: string }>>(() => {
    try { const saved = JSON.parse(localStorage.getItem("ayuranex_audit_logs") || "[]"); return Array.isArray(saved) ? saved : []; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("ayuranex_audit_logs", JSON.stringify(auditLogs)); }, [auditLogs]);
  const addAudit = (action: string, trialId: string) => {
    setAuditLogs((current) => [{ id: `AUD-${Date.now()}`, actor: userRole, action, trialId, timestamp: new Date().toISOString() }, ...current].slice(0, 500));
  };

  const [excelHandle, setExcelHandle] = useState<any>(null);
  const [excelStatus, setExcelStatus] = useState("Excel not connected");

  useEffect(() => { localStorage.setItem("ayuranex_participants", JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem("ayuranex_safety_events", JSON.stringify(safetyEventsState)); }, [safetyEventsState]);
  useEffect(() => { localStorage.setItem("ayuranex_compliance", JSON.stringify(complianceState)); }, [complianceState]);
  useEffect(() => { localStorage.setItem("ayuranex_actions", JSON.stringify(actionState)); }, [actionState]);

const handleAddTrial = async () => {
  if (userRole === "Regulator") {
    alert("Regulator accounts have read-only inspection access. Clinical trial creation and modification are restricted to Principal Investigators and Institutional Admins.");
    return;
  }

  const targetPatients = Number(newTrial.targetPatients);
  const enrolled = 0; // Newly registered trials start at 0 enrolled subjects per CTRI protocol

  if (
    !newTrial.trialId.trim() ||
    !newTrial.studyName.trim() ||
    !newTrial.investigator.trim() ||
    !newTrial.intervention.trim() ||
    newTrial.targetPatients === "" ||
    !Number.isFinite(targetPatients) ||
    targetPatients <= 0
  ) {
    alert(
      "Enter valid clinical trial details. CTRI/Protocol ID, study title, investigator, intervention and target sample size (> 0) are required."
    );
    return;
  }

  const computedPhase = computeAutoStudyPhase({ targetPatients, enrolled });
  const trialToAdd: Trial = {
    trialId: newTrial.trialId.trim(),
    studyName: newTrial.studyName.trim(),
    investigator: newTrial.investigator.trim(),
    targetPatients,
    enrolled,
    status: "Active",
    systemOfMedicine: newTrial.systemOfMedicine,
    studyFocus: newTrial.studyFocus.trim() || DEFAULT_FOCUS,
    studyMethod: newTrial.studyMethod || DEFAULT_METHOD,
    studyType: newTrial.studyType,
    phase: computedPhase,
    intervention: newTrial.intervention.trim(),
    sponsor: newTrial.sponsor.trim(),
    recruitmentStatus: newTrial.recruitmentStatus,
  };

  // 1. Save to Supabase Cloud
  try {
    const { error } = await supabase
      .from("trials")
      .insert([
        {
          trial_id: trialToAdd.trialId,
          study_name: trialToAdd.studyName,
          investigator: trialToAdd.investigator,
          target_patients: trialToAdd.targetPatients,
          enrolled: trialToAdd.enrolled,
          status: trialToAdd.status,
        },
      ]);
    if (error) {
      console.warn("Supabase trial sync note (local clinical storage guaranteed):", error.message);
    }
  } catch (err) {
    console.warn("Supabase network note:", err);
  }

  // 2. Persist to localStorage so the trial stays permanently even after refreshing the site
  try {
    const existing = JSON.parse(localStorage.getItem("ayuranex_user_trials") || "[]");
    const updated = Array.isArray(existing)
      ? [...existing.filter((t: any) => t.trialId?.trim().toUpperCase() !== trialToAdd.trialId.toUpperCase()), trialToAdd]
      : [trialToAdd];
    localStorage.setItem("ayuranex_user_trials", JSON.stringify(updated));
    setUserTrialsState(updated);
  } catch (e) {
    console.error("Local storage persistence error:", e);
  }

  // 3. Update local UI state
  setTrials((currentTrials) => [
    ...currentTrials.filter((t) => t.trialId?.trim().toUpperCase() !== trialToAdd.trialId.toUpperCase()),
    trialToAdd
  ]);
  setTrialMeta((current) => ({
    ...current,
    [trialToAdd.trialId]: {
      systemOfMedicine: trialToAdd.systemOfMedicine,
      studyFocus: trialToAdd.studyFocus,
      studyMethod: trialToAdd.studyMethod,
      studyType: trialToAdd.studyType || "Interventional",
      phase: trialToAdd.phase || "Phase I (Safety & Clinical Tolerability)",
      intervention: trialToAdd.intervention || "",
      sponsor: trialToAdd.sponsor || "",
      recruitmentStatus: trialToAdd.recruitmentStatus || "Recruiting"
    }
  }));

  setNewTrial({
    trialId: "",
    studyName: "",
    investigator: "",
    targetPatients: "",
    enrolled: "",
    systemOfMedicine: "Ayurveda",
    studyFocus: DEFAULT_FOCUS,
    studyMethod: DEFAULT_METHOD,
    studyType: "Interventional",
    phase: "Not Applicable",
    intervention: "",
    sponsor: "",
    recruitmentStatus: "Recruiting",
  });

  setShowAddTrial(false);

  addAudit(`Added clinical trial: ${trialToAdd.studyName}`, trialToAdd.trialId);
  alert("Trial saved successfully!");
};    const selectedParticipantTrial = trials.find((t) => t.trialId === participantTrialId);

  const openParticipantForm = (trialId: string) => {
    const trial = trials.find((t) => t.trialId === trialId);
    const nextNumber = (trial?.enrolled ?? 0) + 1;
    const cleanTrialCode = trialId.includes("/")
      ? (trialId.split("/")[3] || trialId.replace(/\D/g, "").slice(-6))
      : trialId.replace(/[^A-Za-z0-9]/g, "").slice(-6);
    const usubjid = `AIIA-${cleanTrialCode}-SITE01-${String(nextNumber).padStart(3, "0")}`;
    setParticipantTrialId(trialId);
    setNewParticipant({
      id: usubjid,
      age: "",
      sex: "Female",
      enrollmentDate: new Date().toISOString().slice(0, 10),
      site: "AIIA Main Hospital, New Delhi",
      consent: "Obtained",
      treatmentArm: trial?.intervention || "Standardized Formulation Arm",
      baselineCondition: trial?.studyName || "Targeted Clinical Indication",
      presentingComplaint: "Mild-to-moderate clinical symptoms; eligible per protocol",
      diagnosis: trial?.studyName || "Protocol Verified Diagnosis",
      diseaseDuration: "12 months",
      currentSymptoms: "Documented at screening visit",
      priorTreatment: "Conservative Ayurvedic therapy",
      familyHistory: "Reviewed and documented in patient trial dossier",
      lifestyleFactors: "Agni: Sama; Kostha: Madhyama; Dhatu Sarata: Pravara",
      prakriti: "Vata-Pitta",
      doshaAssessment: "Vata: 44%, Pitta: 36%, Kapha: 20%",
      medicalHistory: "Screening complete; all baseline eligibility criteria satisfied",
      allergies: "None reported",
      concomitantMedication: "None reported",
      baselineVitals: "BP 124/80 mmHg; Pulse 72 bpm; Temp 98.4°F; BMI 23.8 kg/m²",
      labSummary: "FBS 94 mg/dL; HbA1c 5.5%; SGOT 22 U/L; SGPT 24 U/L; Creatinine 0.86 mg/dL",
      inclusionCriteria: "Met",
      exclusionCriteria: "None",
      visitSchedule: "Baseline; Week 4; Week 8; Week 12; Week 16",
      adherence: "Good",
      followUpStatus: "Scheduled",
      outcomeNotes: `ABHA ID: 91-4821-${String(3000 + nextNumber).slice(-4)}-${String(7000 + nextNumber).slice(-4)} • e-Consent Verified`,
      notes: `CDISC SDTM Record enrolled under GCP-ASU guidelines`
    });
    setShowAddParticipant(true);
  };

  const handleAddParticipant = async () => {
    if (userRole === "Regulator") {
      alert("Regulator accounts have read-only inspection access. Participant enrolment is restricted to Investigators and Coordinators.");
      return;
    }
    const trial = trials.find((t) => t.trialId === participantTrialId);
    const age = Number(newParticipant.age);
    const id = newParticipant.id.trim();
    if (!trial) return alert("Select a valid trial.");
    if (trial.enrolled >= trial.targetPatients) return alert("Recruitment target already reached for this trial.");
    if (!id || !Number.isFinite(age) || age < 1 || age > 120 || !newParticipant.sex || !newParticipant.enrollmentDate || !newParticipant.site.trim() || !newParticipant.baselineCondition.trim() || newParticipant.consent !== "Obtained") {
      return alert("Please complete all required participant details. Consent must be obtained before enrolment.");
    }
    if (participants.some((p) => p.id.toLowerCase() === id.toLowerCase())) return alert("Participant ID already exists.");

    const participant: Participant = {
      id, trialId: trial.trialId, age, sex: newParticipant.sex,
      enrollmentDate: newParticipant.enrollmentDate, site: newParticipant.site.trim(),
      consent: newParticipant.consent, treatmentArm: newParticipant.treatmentArm.trim() || "Not specified",
      baselineCondition: newParticipant.baselineCondition.trim(), presentingComplaint: newParticipant.presentingComplaint.trim(), diagnosis: newParticipant.diagnosis.trim(), diseaseDuration: newParticipant.diseaseDuration.trim(), currentSymptoms: newParticipant.currentSymptoms.trim(), priorTreatment: newParticipant.priorTreatment.trim(), familyHistory: newParticipant.familyHistory.trim(), lifestyleFactors: newParticipant.lifestyleFactors.trim(), prakriti: newParticipant.prakriti.trim(), doshaAssessment: newParticipant.doshaAssessment.trim(), medicalHistory: newParticipant.medicalHistory.trim(),
      allergies: newParticipant.allergies.trim(), concomitantMedication: newParticipant.concomitantMedication.trim(),
      baselineVitals: newParticipant.baselineVitals.trim(), labSummary: newParticipant.labSummary.trim(),
      inclusionCriteria: newParticipant.inclusionCriteria, exclusionCriteria: newParticipant.exclusionCriteria,
      visitSchedule: newParticipant.visitSchedule.trim(), adherence: newParticipant.adherence,
      followUpStatus: newParticipant.followUpStatus, outcomeNotes: newParticipant.outcomeNotes.trim(),
      notes: newParticipant.notes.trim(), createdAt: new Date().toISOString()
    };
    const nextEnrolled = trial.enrolled + 1;
    const { error } = await supabase.from("trials").update({ enrolled: nextEnrolled }).eq("trial_id", trial.trialId);
    if (error) {
      console.warn("Trial database update failed; keeping participant in persistent local prototype storage:", error);
    }
    setParticipants((current) => [...current, participant]);
    setEnrollmentOverrides((current) => ({ ...current, [trial.trialId]: nextEnrolled }));
    const newPhase = computeAutoStudyPhase({ targetPatients: trial.targetPatients, enrolled: nextEnrolled });
    setTrials((current) => current.map((t) => t.trialId === trial.trialId ? {
      ...t,
      enrolled: nextEnrolled,
      phase: newPhase,
      status: nextEnrolled >= t.targetPatients ? "Completed" : t.status
    } : t));

    try {
      const existing = JSON.parse(localStorage.getItem("ayuranex_user_trials") || "[]");
      if (Array.isArray(existing) && existing.some((ut: any) => ut.trialId === trial.trialId)) {
        const updated = existing.map((ut: any) =>
          ut.trialId === trial.trialId
            ? { ...ut, enrolled: nextEnrolled, phase: newPhase }
            : ut
        );
        localStorage.setItem("ayuranex_user_trials", JSON.stringify(updated));
        setUserTrialsState(updated);
      }
    } catch (e) {
      console.error("Local storage enrollment sync error:", e);
    }
    setShowAddParticipant(false);
    addAudit(`Enrolled participant ${id}`, trial.trialId);
    alert(`${id} enrolled successfully. ${trial.enrolled} → ${nextEnrolled}`);
  };

  const handleAddSafety = () => {
    if (userRole === "Regulator") {
      alert("Regulator accounts have read-only inspection access. Safety reports must originate from trial sites or Pharmacovigilance leads.");
      return;
    }
    if (!newSafety.trialId || !newSafety.participantId || !newSafety.event.trim() || !newSafety.onsetDate) return alert("Select a study and patient, then fill all required safety event fields.");
    const critical = newSafety.type === "SAE" || newSafety.severity === "Severe" || newSafety.severity === "Life-threatening";
    const item: SafetyEvent = {
      id: `SAF-${Date.now()}`,
      trialId: newSafety.trialId,
      participantId: newSafety.participantId.trim() || "Not linked",
      type: newSafety.type,
      event: newSafety.event.trim(),
      severity: newSafety.severity,
      onsetDate: newSafety.onsetDate,
      status: critical ? "Escalated" : newSafety.status,
      suspectedMedicine: newSafety.suspectedMedicine.trim(),
      causality: newSafety.causality,
      actionTaken: newSafety.actionTaken.trim(),
      outcome: newSafety.outcome,
      seriousnessCriteria: newSafety.seriousnessCriteria.trim()
    };
    setSafetyEventsState((current) => [...current, item]);
    setShowAddSafety(false);
    setNewSafety({ trialId: "", participantId: "", type: "AE", event: "", severity: "Mild", onsetDate: new Date().toISOString().slice(0,10), status: "Open", suspectedMedicine: "", causality: "Not assessed", actionTaken: "", outcome: "Ongoing", seriousnessCriteria: "" });
    addAudit(`${critical ? "CRITICAL escalation: " : ""}Recorded ${item.type}: ${item.event}`, item.trialId);
    alert(critical ? "Safety event recorded and marked for immediate review." : "Safety event recorded successfully.");
  };

  const handleAddCompliance = () => {
    if (userRole === "Regulator") {
      alert("Regulator accounts have read-only inspection access.");
      return;
    }
    if (!newCompliance.trialId || !newCompliance.item.trim() || !newCompliance.dueDate) return alert("Fill all required compliance fields.");
    const item: ComplianceItem = { id: `CMP-${Date.now()}`, trialId: newCompliance.trialId, item: newCompliance.item.trim(), dueDate: newCompliance.dueDate, status: newCompliance.status };
    setComplianceState((current) => [...current, item]);
    setShowAddCompliance(false);
    setNewCompliance({ trialId: "", item: "", dueDate: new Date().toISOString().slice(0,10), status: "Upcoming" });
    addAudit(`Added compliance requirement: ${item.item}`, item.trialId);
    alert("Compliance item added successfully.");
  };

  const handleAddAction = () => {
    if (userRole === "Regulator") {
      alert("Regulator accounts have read-only inspection access.");
      return;
    }
    if (!newAction.trialId || !newAction.action.trim() || !newAction.owner.trim() || !newAction.dueDate) return alert("Fill all required action fields.");
    const item: ActionItem = { id: `ACT-${Date.now()}`, trialId: newAction.trialId, action: newAction.action.trim(), owner: newAction.owner.trim(), dueDate: newAction.dueDate, priority: newAction.priority, status: newAction.status };
    setActionState((current) => [...current, item]);
    setShowAddAction(false);
    setNewAction({ trialId: "", action: "", owner: "Investigator", dueDate: new Date().toISOString().slice(0,10), priority: "Medium", status: "Open" });
    addAudit(`Created action: ${item.action}`, item.trialId);
    alert("Action added successfully.");
  };

  const riskRows = useMemo(() => trials.map((trial) => {
    const recruitment = trial.targetPatients > 0 ? Math.round(Math.min((trial.enrolled / trial.targetPatients) * 100, 100)) : 0;
    const trialParticipants = participants.filter((p) => p.trialId === trial.trialId);
    const trialSafety = safetyEventsState.filter((e) => e.trialId === trial.trialId);
    const severeEvents = trialSafety.filter((e) => e.severity === "Severe" || e.severity === "Life-threatening").length;
    const criticalEvents = trialSafety.filter((e) => e.type === "SAE" || e.severity === "Life-threatening").length;
    const openSafety = trialSafety.filter((e) => e.status !== "Closed").length;
    const hasOverdue = complianceState.some((c) => c.trialId === trial.trialId && c.status === "Overdue");
    const openCompliance = complianceState.filter((c) => c.trialId === trial.trialId && c.status !== "Completed").length;
    const openActions = actionState.filter((a) => a.trialId === trial.trialId && a.status !== "Completed").length;
    const unlinkedSafety = trialSafety.filter((e) => !e.participantId || e.participantId === "Not linked").length;
    const incompletePatients = trialParticipants.filter((p) => !p.baselineCondition || !p.medicalHistory || !p.baselineVitals || !p.labSummary || !p.visitSchedule).length;
    const lowRecruitment = recruitment < 50;
    const stagnantRecruitment = trial.enrolled === 0 && trial.targetPatients > 0;

    let riskScore = 0;
    if (lowRecruitment) riskScore += 25;
    if (stagnantRecruitment) riskScore += 10;
    if (hasOverdue) riskScore += 20;
    if (openSafety > 0) riskScore += Math.min(15, openSafety * 5);
    if (severeEvents > 0) riskScore += Math.min(25, severeEvents * 15);
    if (criticalEvents > 0) riskScore += 10;
    if (openActions > 0) riskScore += Math.min(10, openActions * 3);
    if (unlinkedSafety > 0) riskScore += Math.min(5, unlinkedSafety * 2);
    if (incompletePatients > 0) riskScore += Math.min(10, incompletePatients * 2);
    riskScore = Math.min(100, riskScore);

    const riskLevel = riskScore >= 60 ? "High" : riskScore >= 30 ? "Medium" : "Low";
    const reasons = [
      lowRecruitment ? `Recruitment below 50% (${recruitment}%)` : "Recruitment on track",
      stagnantRecruitment ? "No participant enrolled yet" : "Participant enrolment recorded",
      severeEvents ? `${severeEvents} severe/life-threatening safety event(s)` : "No severe safety event recorded",
      criticalEvents ? `${criticalEvents} SAE/life-threatening event(s)` : "No critical safety escalation",
      hasOverdue ? "Overdue compliance requirement" : "Compliance deadlines clear",
      openCompliance ? `${openCompliance} compliance item(s) still open` : "No open compliance backlog",
      openActions ? `${openActions} open action(s)` : "No open action backlog",
      incompletePatients ? `${incompletePatients} participant record(s) need baseline completion` : "Participant baseline records complete",
      unlinkedSafety ? `${unlinkedSafety} safety event(s) not linked to a patient` : "Safety records linked to patients"
    ];
    const recommendedAction = riskLevel === "High"
      ? "Immediate clinical and operational review; address critical safety, recruitment or compliance drivers first."
      : riskLevel === "Medium"
      ? "Review contributing factors, assign corrective action and schedule a follow-up check."
      : "Continue routine monitoring and periodic review.";
    return {
      trial, recruitment, hasSAE: criticalEvents > 0, hasOverdue, riskCount: [lowRecruitment, stagnantRecruitment, severeEvents > 0, criticalEvents > 0, hasOverdue, openActions > 0, incompletePatients > 0, unlinkedSafety > 0].filter(Boolean).length,
      riskLevel, riskScore, healthScore: 100 - riskScore, earlyWarningScore: riskScore, reasons, recommendedAction,
      severeEvents, criticalEvents, openSafety, openActions, openCompliance, unlinkedSafety, incompletePatients
    };
  }), [trials, participants, safetyEventsState, complianceState, actionState]);

  const calculatedAttentionTrials = riskRows.filter((row) => row.riskLevel !== "Low").length;

  const buildWorkbook = () => {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error("Excel library is not loaded. Add the SheetJS browser script to index.html.");
    const wb = XLSX.utils.book_new();
    const append = (name: string, rows: any[]) => {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: "No records" }]);
      const sample = rows.length ? rows[0] : { Message: "No records" };
      ws["!cols"] = Object.keys(sample).map((key) => ({
        wch: Math.min(42, Math.max(14, key.length + 4, ...rows.slice(0, 50).map((r: any) => String(r[key] ?? "").length + 2)))
      }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    append("Trial Management", trials.map(t => ({ "Trial ID": t.trialId, "Study Name": t.studyName, "Principal Investigator": t.investigator, "Target Patients": t.targetPatients, "Enrolled": t.enrolled, "Recruitment %": t.targetPatients ? Math.round((t.enrolled / t.targetPatients) * 100) : 0, Status: t.status, "System of Medicine": t.systemOfMedicine, "Study Focus": t.studyFocus, "Study Method / Design": t.studyMethod || trialMeta[t.trialId]?.studyMethod || "Not specified", "Study Type": t.studyType || trialMeta[t.trialId]?.studyType || "Not specified", Phase: t.phase || trialMeta[t.trialId]?.phase || "Not specified", Intervention: t.intervention || trialMeta[t.trialId]?.intervention || "Not specified", Sponsor: t.sponsor || trialMeta[t.trialId]?.sponsor || "Not specified", "Recruitment Status": t.recruitmentStatus || trialMeta[t.trialId]?.recruitmentStatus || "Not specified" })));
    append("Recruitment", trials.map(t => ({ "Trial ID": t.trialId, "Study Name": t.studyName, "Enrolled": t.enrolled, Target: t.targetPatients, "Recruitment %": t.targetPatients ? Math.round(Math.min((t.enrolled / t.targetPatients) * 100, 100)) : 0 })));
    append("Participant Registry", participants.map(p => ({ "Participant ID": p.id, "Trial ID": p.trialId, Age: p.age, Sex: p.sex, "Enrollment Date": p.enrollmentDate, Site: p.site, Consent: p.consent, "Treatment Arm": p.treatmentArm, "Baseline Condition": p.baselineCondition, "Presenting Complaint": p.presentingComplaint, Diagnosis: p.diagnosis, "Disease Duration": p.diseaseDuration, "Current Symptoms": p.currentSymptoms, "Prior Treatment": p.priorTreatment, "Family History": p.familyHistory, "Lifestyle Factors": p.lifestyleFactors, Prakriti: p.prakriti, "Dosha Assessment": p.doshaAssessment, "Medical History": p.medicalHistory, Allergies: p.allergies, "Concomitant Medication": p.concomitantMedication, "Baseline Vitals": p.baselineVitals, "Lab Summary": p.labSummary, "Inclusion Criteria": p.inclusionCriteria, "Exclusion Criteria": p.exclusionCriteria, "Visit Schedule": p.visitSchedule, Adherence: p.adherence, "Follow-up Status": p.followUpStatus, "Outcome Notes": p.outcomeNotes, Notes: p.notes })));
    append("Safety Center", safetyEventsState.map(e => ({ "Event ID": e.id, "Trial ID": e.trialId, "Participant ID": e.participantId, Type: e.type, Event: e.event, Severity: e.severity, "Onset Date": e.onsetDate, Status: e.status, "Suspected Medicine": e.suspectedMedicine, Causality: e.causality, "Action Taken": e.actionTaken, Outcome: e.outcome, "Seriousness Criteria": e.seriousnessCriteria })));
    append("Compliance", complianceState.map(c => ({ "Compliance ID": c.id, "Trial ID": c.trialId, Item: c.item, "Due Date": c.dueDate, Status: c.status })));
    append("Risk & Alerts", riskRows.map(r => ({ "Trial ID": r.trial.trialId, "Recruitment %": r.recruitment, "Safety Alert": r.hasSAE ? "SAE" : "None", "Compliance Alert": r.hasOverdue ? "Overdue" : "None", "Risk Level": r.riskLevel, "Health Score": r.healthScore, "Early Warning Score": r.earlyWarningScore })));
    append("Action Center", actionState.map(a => ({ "Action ID": a.id, "Trial ID": a.trialId, Action: a.action, Owner: a.owner, "Due Date": a.dueDate, Priority: a.priority, Status: a.status })));
    append("Audit Trail", auditLogs.map(a => ({ "Audit ID": a.id, Actor: a.actor, Action: a.action, "Trial ID": a.trialId, Timestamp: a.timestamp })));
    append("FHIR-CDISC Mapping", [
      { Entity: "Clinical Trial", "FHIR R4": "ResearchStudy", "CDISC": "Study / SDTM" },
      { Entity: "Participant", "FHIR R4": "Patient", "CDISC": "Demographics (DM)" },
      { Entity: "Safety Event", "FHIR R4": "AdverseEvent", "CDISC": "Adverse Events (AE)" },
      { Entity: "Visit / Observation", "FHIR R4": "Encounter / Observation", "CDISC": "SDTM Findings" }
    ]);
    append("Analytics", [{ "Total Trials": trials.length, "Active Trials": activeTrials, "Completed Trials": completedTrials, "Attention Trials": attentionTrials, "Total Enrolled": trials.reduce((s,t)=>s+t.enrolled,0), "Total Target": trials.reduce((s,t)=>s+t.targetPatients,0), "Safety Events": safetyEventsState.length, "Open Actions": actionState.filter(a=>a.status === "Open").length }]);
    return wb;
  };

  const downloadExcel = () => {
    try {
      const XLSX = window.XLSX;
      const wb = buildWorkbook();
      XLSX.writeFile(wb, "AyuraNex_Clinical_Research.xlsx");
    } catch (e) { console.error(e); alert("Excel export failed. Please ensure the Excel library is loaded."); }
  };

  const downloadPatientReport = (patientId: string, trialId: string) => {
    try {
      const trial = trials.find(t => t.trialId === trialId);
      const patient = participants.find(p => p.id === patientId && p.trialId === trialId);
      if (!trial || !patient) { alert("Patient record not found."); return; }
      const events = safetyEventsState.filter(e => e.trialId === trialId && e.participantId === patientId);
      downloadPatientReportPdf(patient as any, trial as any, events as any);
    } catch (e) {
      console.error(e);
      alert("Patient report PDF download failed.");
    }
  };

  const downloadPatientHealthHistory = (patientId: string, trialId: string) => {
    try {
      const trial = trials.find(t => t.trialId === trialId);
      const patient = participants.find(p => p.id === patientId && p.trialId === trialId);
      if (!trial || !patient) { alert("Patient health record not found."); return; }
      downloadPatientHealthHistoryPdf(patient as any, trial as any);
    } catch (e) {
      console.error(e);
      alert("Patient health history PDF download failed.");
    }
  };

  const downloadAllPatientReports = (trialId: string) => {
    try {
      const trial = trials.find(t => t.trialId === trialId);
      const trialPatients = participants.filter(p => p.trialId === trialId);
      if (!trial) { alert("Select a valid study first."); return; }
      if (!trialPatients.length) { alert("No patient records have been entered for this study yet."); return; }
      const events = safetyEventsState.filter(e => e.trialId === trialId);
      downloadAllPatientReportsPdf(trial as any, trialPatients as any, events as any);
    } catch (e) {
      console.error(e);
      alert("All patient reports PDF download failed.");
    }
  };

  const writeConnectedExcel = async () => {
    if (!excelHandle) return;
    try {
      const XLSX = window.XLSX;
      const wb = buildWorkbook();
      const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const writable = await excelHandle.createWritable();
      await writable.write(bytes);
      await writable.close();
      setExcelStatus("Excel synced");
    } catch (e) { console.error(e); setExcelStatus("Excel sync failed"); }
  };

  const connectExcel = async () => {
    if (!window.showSaveFilePicker) return alert("Direct Excel sync is supported on desktop Chrome/Edge. Use Export Excel on unsupported browsers.");
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: "AyuraNex_Clinical_Research.xlsx", types: [{ description: "Excel Workbook", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } }] });
      setExcelHandle(handle);
      setExcelStatus("Excel connected");
    } catch (e) { console.log("Excel connection cancelled", e); }
  };

  useEffect(() => {
    if (excelHandle && window.XLSX) writeConnectedExcel();
  }, [excelHandle, trials, participants, safetyEventsState, complianceState, actionState]);

const menuItems = [
  {
    name: "Command Center",
    icon: LayoutDashboard,
    badge: null,
    roles: [
      "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
    ]
  },
  {
    name: "Trial Management",
    icon: FlaskConical,
    badge: "CTRI",
    roles: ["Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Regulator"]
  },
  {
    name: "Recruitment & Patients",
    icon: Users,
    badge: "CDISC",
    roles: [
      "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
    ]
  },
  {
    name: "Pharmacovigilance (NPvCC)",
    icon: ShieldAlert,
    badge: "24h SAE",
    roles: [
      "Admin", "Principal Investigator", "Ethics Committee", "Pharmacovigilance", "Regulator"
    ]
  },
  {
    name: "CDISC Standards",
    icon: Database,
    badge: "SDTM",
    roles: [
      "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Regulator"
    ]
  },
  {
    name: "HL7 FHIR & ABDM",
    icon: Share2,
    badge: "R4",
    roles: [
      "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Regulator"
    ]
  },
  {
    name: "Regulatory & CTRI",
    icon: FileCheck2,
    badge: "NDCT 2019",
    roles: [
      "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Regulator"
    ]
  },
  {
    name: "ALCOA+ Audit Vault",
    icon: ShieldCheck,
    badge: "SHA-256",
    roles: [
      "Admin", "Principal Investigator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
    ]
  },
  {
    name: "Reports & Analytics",
    icon: FileText,
    badge: null,
    roles: [
      "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
    ]
  },
  {
    name: "Security & Access Logs",
    icon: ShieldCheck,
    badge: "Admin",
    roles: ["Admin"]
  },
];

const allowedPages: Record<string, string[]> = {
  "Command Center": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "Trial Management": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Regulator"
  ],
  "Recruitment & Patients": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "Recruitment": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "Pharmacovigilance (NPvCC)": [
    "Admin", "Principal Investigator", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "CDISC Standards": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Regulator"
  ],
  "HL7 FHIR & ABDM": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Regulator"
  ],
  "Regulatory & CTRI": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Regulator"
  ],
  "ALCOA+ Audit Vault": [
    "Admin", "Principal Investigator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "Reports & Analytics": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "Security & Access Logs": ["Admin"],
  "Reports": [
    "Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Pharmacovigilance", "Regulator"
  ],
  "Analytics": ["Admin", "Principal Investigator"],
  "Safety Center": ["Admin", "Principal Investigator", "Ethics Committee", "Pharmacovigilance"],
  "Compliance": ["Admin", "Principal Investigator", "Clinical Coordinator", "Clinical Monitor", "Ethics Committee", "Regulator"],
  "Risk & Alerts": ["Admin", "Clinical Monitor", "Pharmacovigilance"],
  "Action Center": ["Admin", "Clinical Monitor", "Pharmacovigilance"],
};
const hasPageAccess =
  allowedPages[activePage]?.includes(userRole) ?? false;

if (!hasPageAccess) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl shadow-sm border p-8 text-center">
        <h1 className="text-2xl font-bold text-red-400">
          Access Restricted
        </h1>

        <p className="mt-2 text-slate-400">
          Your role does not have permission to access this page.
        </p>

        <button
          onClick={() => setActivePage("Command Center")}
          className="mt-5 px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold"
        >
          Back to Command Center
        </button>
      </div>
    </div>
  );
}
if (!isLoggedIn) {
  return (
    <Login
      onLogin={(role) => {
        setUserRole(role);
        setIsLoggedIn(true);
      }}
    />
  );
}

return (
  <div className="ayura-dashboard relative min-h-screen overflow-hidden bg-slate-950">
    <style>{`@media print {
  @page { size: A4 portrait; margin: 12mm; }
  body { background: #fff !important; color: #111 !important; }
  aside, header, .print-hide, button, input, select, textarea, .ayura-symbol { display: none !important; }
  .ml-64 { margin-left: 0 !important; }
  main { margin-left: 0 !important; width: 100% !important; }
  .glass-card { background: #fff !important; color: #111 !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; break-inside: avoid; }
  .text-slate-50, .text-slate-200, .text-slate-300 { color: #111 !important; }
  .text-slate-400, .text-slate-500 { color: #475569 !important; }
  .report-grid { grid-template-columns: 1fr 1fr !important; }
  .print-area { padding: 0 !important; width: 100% !important; }
  .dark-table th { color: #111 !important; background: #f1f5f9 !important; }
  .dark-table td { color: #111 !important; }\n  .report-page { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  .print-hide { display: none !important; }
}`}</style>
    <style>{`
      .ayura-dashboard {
        background:
          radial-gradient(circle at 12% 10%, rgba(20,184,166,.16), transparent 22%),
          radial-gradient(circle at 88% 16%, rgba(99,102,241,.16), transparent 25%),
          radial-gradient(circle at 52% 92%, rgba(16,185,129,.08), transparent 30%),
          #030712 !important;
        color:#e5e7eb !important;
      }
      .glass-card {
        position:relative; overflow:hidden;
        transition:transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease;
        border:1px solid rgba(148,163,184,.16);
        background:linear-gradient(145deg,rgba(15,23,42,.90),rgba(8,15,29,.78)) !important;
        box-shadow:0 16px 40px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter:blur(22px); -webkit-backdrop-filter:blur(22px);
      }
      .glass-card::before {
        content:""; position:absolute; inset:0; pointer-events:none;
        background:linear-gradient(135deg,rgba(20,184,166,.035),transparent 42%,rgba(99,102,241,.035));
      }
      .glass-card:hover {
        transform:translateY(-3px);
        border-color:rgba(94,234,212,.28);
        box-shadow:0 22px 52px rgba(0,0,0,.42),0 0 28px rgba(20,184,166,.06),inset 0 1px 0 rgba(255,255,255,.09);
      }

      .ayura-symbol {
        position:fixed; z-index:1; pointer-events:none; display:flex; align-items:center; justify-content:center;
        width:58px; height:58px; border:1px solid rgba(45,212,191,.30); border-radius:20px;
        background:linear-gradient(145deg,rgba(20,184,166,.14),rgba(99,102,241,.13));
        backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
        color:rgba(94,234,212,.92);
        box-shadow:0 12px 35px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.10),0 0 22px rgba(20,184,166,.06);
        animation:ayuraFloat 10s ease-in-out infinite;
      }
      .ayura-symbol::after {
        content:""; position:absolute; inset:-10px; border-radius:26px;
        border:1px solid rgba(45,212,191,.09); animation:symbolPulse 4s ease-in-out infinite;
      }
      .ayura-symbol:nth-child(even){animation-duration:13s}.ayura-symbol:nth-child(3n){animation-duration:16s}
      @keyframes ayuraFloat {0%,100%{transform:translate3d(0,0,0) rotate(-4deg) scale(1);opacity:.58}50%{transform:translate3d(0,-24px,0) rotate(5deg) scale(1.06);opacity:.92}}
      @keyframes symbolPulse {0%,100%{transform:scale(.94);opacity:.16}50%{transform:scale(1.06);opacity:.48}}

      .liquid-sidebar {
        background:linear-gradient(180deg,rgba(5,18,32,.97),rgba(2,8,20,.99)) !important;
        border-right:1px solid rgba(94,234,212,.18); box-shadow:18px 0 55px rgba(0,0,0,.42);
        backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px);
      }
      .liquid-sidebar::after {content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.055),transparent 28%,rgba(20,184,166,.035));}
      .liquid-menu-item {position:relative;overflow:hidden;border:1px solid transparent;transition:transform 220ms ease,background 220ms ease,box-shadow 220ms ease,border-color 220ms ease;}
      .liquid-menu-item::before {content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 15%,rgba(255,255,255,.13) 50%,transparent 85%);transform:translateX(-120%);transition:transform 600ms ease;}
      .liquid-menu-item:hover::before {transform:translateX(120%)}
      .liquid-menu-item:hover {transform:translateX(4px);background:rgba(255,255,255,.065);border-color:rgba(94,234,212,.18);box-shadow:0 8px 24px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.07)}
      .liquid-menu-active {background:linear-gradient(135deg,rgba(20,184,166,.88),rgba(99,102,241,.94)) !important;border-color:rgba(255,255,255,.22) !important;box-shadow:0 10px 30px rgba(79,70,229,.30),inset 0 1px 0 rgba(255,255,255,.25) !important}

      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(45, 212, 191, 0.4) rgba(5, 18, 32, 0.5);
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(5, 18, 32, 0.5);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(45, 212, 191, 0.35);
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(45, 212, 191, 0.7);
      }

      .liquid-header {background:rgba(3,7,18,.82) !important;border-color:rgba(148,163,184,.15) !important;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);box-shadow:0 8px 30px rgba(0,0,0,.25)}
      .liquid-action {border-color:rgba(148,163,184,.20) !important;background:rgba(15,23,42,.68) !important;color:#e2e8f0 !important;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:transform 180ms ease,box-shadow 180ms ease,background 180ms ease}
      .liquid-action:hover {transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.30);background:rgba(30,41,59,.82) !important}

      /* Background-related text palette */
      .ayura-dashboard .text-slate-950,.ayura-dashboard .text-slate-100 {color:#f8fafc !important}
      .ayura-dashboard .text-slate-200 {color:#e2e8f0 !important}
      .ayura-dashboard .text-slate-700 {color:#cbd5e1 !important}
      .ayura-dashboard .text-slate-600 {color:#a5b4fc !important}
      .ayura-dashboard .text-slate-500 {color:#94a3b8 !important}
      .ayura-dashboard .text-slate-400 {color:#64748b !important}
      .ayura-dashboard .text-indigo-300,.ayura-dashboard .text-indigo-700 {color:#a5b4fc !important}
      .ayura-dashboard .text-blue-400 {color:#60a5fa !important}
      .ayura-dashboard .text-emerald-600,.ayura-dashboard .text-emerald-700 {color:#5eead4 !important}
      .ayura-dashboard .text-teal-600,.ayura-dashboard .text-teal-700 {color:#5eead4 !important}
      .ayura-dashboard .border-slate-700,.ayura-dashboard .border-slate-700 {border-color:rgba(148,163,184,.16) !important}
      .ayura-dashboard .bg-slate-950 {background:rgba(15,23,42,.72) !important}
      .ayura-dashboard .bg-slate-900,.ayura-dashboard .bg-slate-900\/90 {background:rgba(15,23,42,.76) !important}
      .ayura-dashboard .bg-slate-900\/80 {background:rgba(15,23,42,.70) !important}
      .ayura-dashboard input,.ayura-dashboard select,.ayura-dashboard textarea {background:rgba(15,23,42,.84) !important;color:#f8fafc !important;border-color:rgba(148,163,184,.22) !important}
      .ayura-dashboard input::placeholder,.ayura-dashboard textarea::placeholder {color:#64748b !important}
      .ayura-dashboard option {background:#0f172a;color:#f8fafc}
      @media (prefers-reduced-motion:reduce){.ayura-symbol,.liquid-menu-item,.glass-card,.liquid-action{animation:none !important;transition:none !important}.glass-card:hover,.liquid-menu-item:hover,.liquid-action:hover{transform:none}}

      .field { width:100%; border:1px solid rgba(148,163,184,.22); border-radius:.5rem; padding:.625rem .75rem; background:rgba(15,23,42,.84); color:#f8fafc; }
      .label { display:block; font-size:.875rem; font-weight:600; color:#e2e8f0; margin-bottom:.25rem; }
      .field::placeholder { color:#64748b; }
      .field:focus { outline:2px solid rgba(99,102,241,.7); outline-offset:1px; }
    `}</style>

    {/* Subtle Ayurveda-inspired background motion */}
    <div aria-hidden="true">
      <div className="ayura-symbol left-[20%] top-[18%]" style={{ animationDelay: "0s" }}><Leaf size={28} /></div>
      <div className="ayura-symbol left-[42%] top-[30%]" style={{ animationDelay: "1.7s" }}><Pill size={26} /></div>
      <div className="ayura-symbol right-[12%] top-[22%]" style={{ animationDelay: "3.2s" }}><Flower2 size={28} /></div>
      <div className="ayura-symbol left-[34%] bottom-[16%]" style={{ animationDelay: "4.6s" }}><Sprout size={30} /></div>
      <div className="ayura-symbol right-[28%] bottom-[11%]" style={{ animationDelay: "6.2s" }}><Sparkles size={26} /></div>
      <div className="ayura-symbol right-[6%] top-[62%]" style={{ animationDelay: "7.5s" }}><Leaf size={24} /></div>
      <div className="ayura-symbol left-[72%] top-[72%]" style={{ animationDelay: "2.5s" }}><Pill size={24} /></div>
    </div>

    {/* Sidebar */}
      <aside className="liquid-sidebar fixed left-0 top-0 h-screen w-64 text-white flex flex-col z-30">

        {/* Logo / Brand Header (shrink-0) */}
        <div className="shrink-0 border-b border-indigo-800/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <AyuraNexLogo size={36} />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                AyuraNex
              </h1>
              <p className="mt-1 text-[11px] font-medium text-teal-300/80 leading-none">
                AIIA CTMS & NPvCC
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-teal-950/60 border border-teal-700/40 px-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">
              GCP-ASU & NDCT 2019
            </span>
          </div>
        </div>

        {/* Navigation (flex-1 overflow-y-auto custom-scrollbar) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar min-h-0">

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-indigo-300/70">
            Clinical Workflows
          </p>

          <div className="space-y-1">

            {menuItems
              .filter((item) => item.roles.includes(userRole))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.name || 
                  (item.name === "Recruitment & Patients" && activePage === "Recruitment") ||
                  (item.name === "Reports & Analytics" && (activePage === "Reports" || activePage === "Analytics"));

                return (
                  <button
                    key={item.name}
                    onClick={() => setActivePage(item.name)}
                    className={`liquid-menu-item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                      isActive
                        ? "liquid-menu-active text-white font-semibold"
                        : "text-indigo-100/85 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={17} className={isActive ? "text-white" : "text-teal-400 shrink-0"} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        isActive ? "bg-white/20 text-white" : "bg-teal-950/80 text-teal-300 border border-teal-700/40"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

          </div>

          {/* Institutional Accreditation Note */}
          <div className="mt-4 border-t border-indigo-800/40 pt-3">
            <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-2.5 text-center">
              <p className="text-[10px] font-semibold text-teal-300">National Pharmacovigilance</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Coordination Centre (NPvCC)</p>
            </div>
          </div>

        </nav>

        {/* Footer (shrink-0) */}
        <div className="shrink-0 border-t border-indigo-900/50 p-3 bg-slate-950/60">
          <div className="rounded-xl border border-indigo-900/40 bg-slate-900/50 p-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Role:</span>
              <span className="font-semibold text-teal-300">{userRole}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Standard:</span>
              <span className="text-slate-300">CDISC / FHIR R4</span>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="relative z-10 ml-64 min-h-screen">

        {/* Top Header */}
        <header className="liquid-header flex items-center justify-between border-b border-slate-700 px-8 py-5">

          <div>
            <h2 className="text-xl font-bold text-slate-50">
              AIIA Clinical Research Command Center
            </h2>

            <p className="text-sm text-slate-400">
              Monitor trials, safety, compliance and research performance
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="text-sm font-semibold text-slate-100">
                {userRole}
              </p>
              <p className="text-xs text-slate-400">Current Role</p>
            </div>

            <div className="glass-avatar flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-indigo-100 font-bold text-indigo-700 shadow-sm ring-1 ring-white/80">
              {userRole.charAt(0)}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={connectExcel} className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60"><Save size={16}/> Connect Excel</button>
              <button type="button" onClick={downloadExcel} className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-indigo-700 bg-indigo-950/40 px-3 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-900/60"><Download size={16}/> Export Excel</button>
              <span className="hidden xl:inline text-xs text-slate-400">{excelStatus}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLoggedIn(false);
                setUserRole("Admin");
                setActivePage("Command Center");
              }}
              className="liquid-action flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-950"
              title="Log out"
            >
              <LogOut size={17} />
              <span>Log out</span>
            </button>

          </div>

        </header>

        {/* Command Center */}
        {activePage === "Command Center" && (
          <section className="p-8 space-y-8">
            {/* Dynamic Role-Based Command View */}
            <RoleViews
              role={userRole}
              onNavigate={(p) => setActivePage(p)}
              onSelectSae={() => setShowUrgentSaeModal(true)}
            />
          </section>
        )}

        {/* Urgent SAE Interactive Alert & Trial Identification Modal */}
        {showUrgentSaeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-red-500/70 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-red-900/50 bg-red-950/50 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/30 text-red-400 border border-red-500/40">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-300">
                        NPvCC Safety Surveillance
                      </span>
                      <span className="text-xs font-mono text-slate-400">NDCT Rules 2019 Table 1</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-0.5">
                      Urgent Serious Adverse Event (SAE) Identified
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUrgentSaeModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
                  aria-label="Close Urgent SAE Modal"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Clinical Trial Identification */}
                <div className="rounded-xl border border-indigo-700/50 bg-indigo-950/40 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Identified Clinical Trial</span>
                  <p className="text-lg font-bold text-white mt-1">
                    CTRI/2023/02/049812 — Ayush-64 in Post-Viral Chronic Fatigue & Inflammatory Sequelae
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Internal Trial Code: <span className="text-slate-200 font-mono">AIIA-CT-2023-05</span> • Lead Dept: <span className="text-slate-200">National Pharmacovigilance Coordination Centre (NPvCC)</span> • PI: <span className="text-slate-200">Dr. Alka Kapoor</span>
                  </p>
                </div>

                {/* Patient & Event Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Affected Patient / Subject</span>
                    <p className="text-base font-mono font-bold text-teal-300 mt-1">
                      AIIA-049812-SITE01-029
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Demographics: 38y Female • Vata-Kapha Prakriti
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      ABHA: 91-9923-4819-1033 (ananya.sen88@abdm)
                    </p>
                  </div>

                  <div className="rounded-xl border border-red-800/40 bg-red-950/25 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">Adverse Reaction Details</span>
                    <p className="text-base font-bold text-red-300 mt-1">
                      Angioedema (MedDRA PT: Angioedema)
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Severity: <span className="text-red-400 font-bold">Severe</span> (Hospitalization / Prolonged)
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Suspected Drug: Ayush-64 Tablets (1000mg BID)
                    </p>
                  </div>
                </div>

                {/* Regulatory Clock Alert */}
                <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4 flex items-start gap-3">
                  <TriangleAlert className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-amber-300">Mandatory 24-Hour Regulatory Clock Active</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Under Rule 42 of New Drugs and Clinical Trials Rules 2019, preliminary electronic notification must be submitted to the Central Licensing Authority (DCGI/CDSCO) and Institutional Ethics Committee within 24 hours of investigator awareness.
                    </p>
                  </div>
                </div>

                {/* Direct Action Navigation Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrgentSaeModal(false);
                      setActivePage("Pharmacovigilance (NPvCC)");
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-500 transition"
                  >
                    <ShieldAlert size={17} />
                    Open Pharmacovigilance & 24h Clock →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUrgentSaeModal(false);
                      setActivePage("Trials Management");
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-700 bg-indigo-950/60 px-4 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-900/60 transition"
                  >
                    <FlaskConical size={17} />
                    View Trial Management →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUrgentSaeModal(false);
                      setReportPatientId("AIIA-049812-SITE01-029");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-700 bg-teal-950/60 px-4 py-3 text-sm font-bold text-teal-200 hover:bg-teal-900/60 transition"
                  >
                    <FileText size={17} />
                    Patient Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAttentionPanel && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-red-800/60 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                <div>
                  <div className="flex items-center gap-3">
                    <TriangleAlert size={22} className="text-red-400" />
                    <h2 className="text-xl font-bold text-slate-50">Trials Requiring Attention</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Risk engine findings for the current clinical-trial portfolio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttentionPanel(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
                  aria-label="Close attention panel"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-6 space-y-4">
                {riskRows.filter((row) => row.riskLevel !== "Low").length ? (
                  riskRows
                    .filter((row) => row.riskLevel !== "Low")
                    .map((row) => (
                      <div
                        key={row.trial.trialId}
                        className="rounded-xl border border-red-900/60 bg-red-950/20 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-bold text-slate-50">{row.trial.studyName}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {row.trial.trialId} • {row.trial.systemOfMedicine} • {row.trial.studyFocus}
                            </p>
                          </div>
                          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold border ${
                            row.riskLevel === "High"
                              ? "bg-red-950 text-red-300 border-red-700"
                              : "bg-amber-950 text-amber-300 border-amber-700"
                          }`}>
                            {row.riskLevel} Risk
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-slate-950/70 p-3">
                            <p className="text-xs text-slate-500">Risk Score</p>
                            <p className="mt-1 text-lg font-bold text-slate-100">{row.riskScore}/100</p>
                          </div>
                          <div className="rounded-lg bg-slate-950/70 p-3">
                            <p className="text-xs text-slate-500">Recruitment</p>
                            <p className="mt-1 text-lg font-bold text-slate-100">{row.recruitment}%</p>
                          </div>
                          <div className="rounded-lg bg-slate-950/70 p-3">
                            <p className="text-xs text-slate-500">Health Score</p>
                            <p className="mt-1 text-lg font-bold text-slate-100">{row.healthScore}/100</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-200">Why attention is required</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-400">
                            {row.reasons.map((reason: string, index: number) => (
                              <li key={index}>• {reason}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 rounded-lg border border-indigo-800/40 bg-indigo-950/20 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Recommended action</p>
                          <p className="mt-1 text-sm text-slate-300">{row.recommendedAction}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-8 text-center">
                    <ShieldCheck className="mx-auto text-emerald-400" size={34} />
                    <p className="mt-3 font-semibold text-emerald-300">No trials currently require attention.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pharmacovigilance (NPvCC) */}
        {activePage === "Pharmacovigilance (NPvCC)" && (
          <section className="p-8">
            <PharmacovigilanceNPvCC userRole={userRole} />
          </section>
        )}

        {/* CDISC Standards */}
        {activePage === "CDISC Standards" && (
          <section className="p-8">
            <CDISCCenter />
          </section>
        )}

        {/* HL7 FHIR & ABDM */}
        {activePage === "HL7 FHIR & ABDM" && (
          <section className="p-8">
            <FHIRGateway />
          </section>
        )}

        {/* Regulatory & CTRI */}
        {activePage === "Regulatory & CTRI" && (
          <section className="p-8">
            <RegulatoryEngine />
          </section>
        )}

        {/* ALCOA+ Audit Vault */}
        {activePage === "ALCOA+ Audit Vault" && (
          <section className="p-8">
            <ALCOAAuditTrail userRole={userRole} />
          </section>
        )}

        {/* Security & Access Logs (Admin Only) */}
        {activePage === "Security & Access Logs" && (
          <section className="p-8">
            <AdminSecurityAudit userRole={userRole} />
          </section>
        )}

        {/* Trial Management */}
{activePage === "Trial Management" && (
  <section className="p-8">

    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-50">
        Trial Management
      </h1>
      <p className="mt-1 text-slate-400">
        Manage and monitor all AIIA clinical trials.
      </p>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-8">

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Total Trials</p>
        <p className="mt-2 text-3xl font-bold text-slate-50">{totalTrials}</p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Active Trials</p>
        <p className="mt-2 text-3xl font-bold text-emerald-400">{activeTrials}</p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Completed</p>
        <p className="mt-2 text-3xl font-bold text-blue-400">{completedTrials}</p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Needs Attention</p>
        <p className="mt-2 text-3xl font-bold text-red-400">{calculatedAttentionTrials}</p>
      </div>

    </div>

    {/* Clinical Trials Table */}
    <div className="glass-card rounded-xl bg-slate-900/90 shadow-sm border overflow-hidden backdrop-blur-sm">

      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-bold text-slate-50">
            Clinical Trials
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Current AIIA clinical trial portfolio
          </p>
        </div>

        {userRole === "Regulator" ? (
          <div className="rounded-xl bg-amber-950/40 border border-amber-700/50 px-4 py-2 text-xs font-semibold text-amber-300 flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-400 shrink-0" />
            <span>CDSCO Regulator: Read-Only Audit Access (Add/Edit Restricted)</span>
          </div>
        ) : (
          <button 
            onClick={() => setShowAddTrial(true)}
            className="rounded-lg bg-indigo-700 px-5 py-3 text-white font-semibold hover:bg-indigo-800 transition"
          >
            + Add Trial
          </button>
        )}
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-left">

          <thead className="bg-slate-950 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Trial ID
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Study Name
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Principal Investigator
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Recruitment
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Study Details
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Status
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {trials.length ? trials.map((trial) => (
  <tr key={trial.trialId} className="hover:bg-slate-950">

    <td className="px-6 py-4 font-semibold">
      {trial.trialId}
    </td>

    <td className="px-6 py-4">
      {trial.studyName}
    </td>

    <td className="px-6 py-4">
      {trial.investigator}
    </td>

    <td className="px-6 py-4">
      {trial.enrolled} / {trial.targetPatients}
    </td>

    <td className="px-6 py-4 min-w-[260px]">
      <p className="text-sm font-semibold text-slate-200">{trial.systemOfMedicine}</p>
      <p className="text-xs text-slate-400 mt-1">{trial.studyFocus}</p>
      <p className="text-xs text-indigo-300 mt-1">{trial.studyMethod || trialMeta[trial.trialId]?.studyMethod || "Not specified"}</p>
            <p className="text-xs text-slate-500 mt-1">{trial.studyType || trialMeta[trial.trialId]?.studyType || ""}{(trial.phase || trialMeta[trial.trialId]?.phase) ? ` • ${trial.phase || trialMeta[trial.trialId]?.phase}` : ""}</p>
    </td>

    <td className="px-6 py-4">
      <span
        className={`rounded-full px-3 py-1 text-sm font-semibold ${
          trial.status === "Active"
            ? "bg-emerald-950/70 text-emerald-300 border border-emerald-700/50"
            : trial.status === "Completed"
            ? "bg-indigo-950/70 text-indigo-300 border border-indigo-700/50"
            : "bg-red-950/70 text-red-300 border border-red-700/50"
        }`}
      >
        {trial.status}
      </span>
    </td>

    <td className="px-6 py-4">
      {userRole === "Regulator" ? (
        <span className="text-xs text-slate-400 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded font-medium">
          Read-Only Audit
        </span>
      ) : (
        <button
          onClick={async () => {
            const confirmDelete = window.confirm(
              `Are you sure you want to remove ${trial.trialId}?`
            );

            if (!confirmDelete) return;

            const { error } = await supabase
              .from("trials")
              .delete()
              .eq("trial_id", trial.trialId);

            if (error) {
              console.error("Supabase delete error:", error);
              alert("Failed to remove trial from database");
              return;
            }

            setTrials((currentTrials) =>
              currentTrials.filter(
                (item) => item.trialId !== trial.trialId
              )
            );

            alert(`${trial.trialId} removed successfully`);
          }}
          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
        >
          Remove
        </button>
      )}
    </td>

  </tr>
)) : <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No user-entered clinical trials yet. Use Add Trial to begin.</td></tr>}

           
          </tbody>

        </table>

      </div>
    </div>

  </section>
)}
{/* Recruitment & Patients */}
{(activePage === "Recruitment" || activePage === "Recruitment & Patients") && (
  <section className="p-8">

    {/* Header */}
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded-full bg-teal-950/70 border border-teal-700/50 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
            CDISC SDTM & ABDM Compliant
          </span>
          <span className="text-xs text-slate-400">GCP-ASU & DPDP Act 2023</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-50">
          Recruitment & Patient Clinical Registry
        </h1>
        <p className="text-slate-400 mt-1">
          Monitor patient enrollment, baseline vitals, organ safety labs, and comprehensive health dossiers across AIIA clinical trials.
        </p>
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Total Enrolled
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-50">
          {trials.reduce(
            (sum, trial) => sum + toNonNegativeNumber(trial.enrolled),
            0
          )}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Total Target
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-50">
          {trials.reduce(
            (sum, trial) => sum + toNonNegativeNumber(trial.targetPatients),
            0
          )}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Overall Recruitment
        </p>

        <p className="mt-2 text-3xl font-bold text-emerald-400">
          {(() => {
            const totalEnrolled = trials.reduce(
              (sum, trial) => sum + toNonNegativeNumber(trial.enrolled),
              0
            );
            const totalTarget = trials.reduce(
              (sum, trial) => sum + toNonNegativeNumber(trial.targetPatients),
              0
            );
            return totalTarget > 0
              ? Math.round(Math.min((totalEnrolled / totalTarget) * 100, 100))
              : 0;
          })()}%
        </p>
      </div>

    </div>

    {/* Trial-wise Recruitment */}
    <div className="glass-card rounded-xl bg-slate-900/90 shadow-sm border overflow-hidden backdrop-blur-sm">

      <div className="p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-50">
            Trial-wise Recruitment
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Enrolment progress for each study. Use the trial-specific "Add Participant" buttons below to enrol subjects into a protocol.
          </p>
        </div>
      </div>

      <div className="divide-y">

        {trials.map((trial) => {

          const percentage =
            toNonNegativeNumber(trial.targetPatients) > 0
              ? Math.round(
                  Math.min(
                    (toNonNegativeNumber(trial.enrolled) /
                      toNonNegativeNumber(trial.targetPatients)) *
                      100,
                    100
                  )
                )
              : 0;

          return (
            <div
              key={trial.trialId}
              className="p-6"
            >

              <div className="flex justify-between items-center mb-3">

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-50">
                    {trial.studyName}
                  </h3>

                  <p className="text-sm font-mono font-semibold text-teal-300 mt-0.5">
                    {trial.trialId}
                  </p>
                  <p className="text-xs text-indigo-300 mt-1">
                    {trial.systemOfMedicine} • {trial.studyFocus} • {trial.studyMethod || trialMeta[trial.trialId]?.studyMethod || "Study design not specified"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Phase: <span className="text-emerald-400 font-semibold">{computeAutoStudyPhase(trial)}</span>
                  </p>
                </div>

                <div className="text-right">

                  <p className="font-semibold text-slate-50">
                    {trial.enrolled} / {trial.targetPatients}
                  </p>

                  <p className="text-sm text-slate-400">
                    {percentage}%
                  </p>

                </div>

              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3">

                <div
                  className={`h-3 rounded-full ${
                    percentage >= 80
                      ? "bg-green-500"
                      : percentage >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      percentage,
                      100
                    )}%`,
                  }}
                />

              </div>

              {/* Low Recruitment Alert */}
              {percentage < 50 && (
                <p className="text-sm text-red-400 mt-2 font-medium">
                  ⚠ Low recruitment — attention required
                </p>
              )}

              <div className="mt-5 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ⚡ AI Auto-Computed Phase
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Good Clinical Practice (GCP) Enforced</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Manual phase switching is locked across all login roles (Admin, Principal Investigator, Monitor, Regulator) to preserve scientific trial auditability. Phase advances automatically based on participant dossier progress and cohort recruitment benchmarks.
                    </p>
                  </div>

                  <div className="px-3.5 py-2 rounded-lg bg-slate-900/90 border border-emerald-500/40 text-emerald-300 font-semibold text-xs sm:text-sm whitespace-nowrap shadow-inner flex items-center gap-2 self-start sm:self-auto">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {computeAutoStudyPhase(trial)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Target: <span className="font-semibold text-slate-300">{trial.targetPatients} subjects</span> • Current: <span className="font-semibold text-teal-300">{trial.enrolled} enrolled</span>
                </p>
                {["Admin", "Principal Investigator", "Clinical Coordinator"].includes(userRole) ? (
                  <button
                    onClick={() => openParticipantForm(trial.trialId)}
                    disabled={trial.enrolled >= trial.targetPatients}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      trial.enrolled >= trial.targetPatients
                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    }`}
                  >
                    {trial.enrolled < trial.targetPatients && <Plus size={16} />}
                    {trial.enrolled >= trial.targetPatients ? "Target Reached" : `Enrol Participant into ${trial.trialId}`}
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg">
                    Auditor View: Read-Only Access
                  </span>
                )}
              </div>

            </div>
          );
        })}

      </div>

    </div>

    {/* Patient Clinical Dossiers & Health Records */}
    <div className="glass-card rounded-2xl bg-slate-900/90 shadow-xl border border-slate-800 overflow-hidden backdrop-blur-sm mt-8">
      <div className="p-6 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-50">Patient Clinical Dossiers & Health Records</h2>
            <span className="rounded-full bg-teal-950/80 border border-teal-700/50 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
              {participants.length} Enrolled Subjects
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Click any Patient ID or "Health Report" to inspect complete baseline vitals, liver/kidney safety labs, Prakriti doshas, and ABDM ABHA credentials.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search ID, diagnosis, site, Prakriti..."
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-80 lg:w-96">
            <select
              value={participantTrialFilter}
              onChange={(e) => setParticipantTrialFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="All">All Registered Trials ({trials.length})</option>
              {trials.map((t) => (
                <option key={t.trialId} value={t.trialId}>
                  {t.studyName} ({t.trialId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400">
              <th className="p-4">Participant USUBJID</th>
              <th className="p-4">Study / CTRI ID</th>
              <th className="p-4">Age / Sex / Prakriti</th>
              <th className="p-4">ABDM ABHA ID</th>
              <th className="p-4">Diagnosis & Arm</th>
              <th className="p-4">Baseline Vitals</th>
              <th className="p-4">Safety Labs (LFT/KFT)</th>
              <th className="p-4">Compliance</th>
              <th className="p-4 text-right">Clinical Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {(() => {
              const q = participantSearch.toLowerCase().trim();
              const filtered = participants.filter((p) => {
                const matchesTrial = participantTrialFilter === "All" || p.trialId === participantTrialFilter;
                const matchesQuery = !q ||
                  p.id.toLowerCase().includes(q) ||
                  p.diagnosis.toLowerCase().includes(q) ||
                  p.site.toLowerCase().includes(q) ||
                  p.prakriti.toLowerCase().includes(q) ||
                  (p.abhaId && p.abhaId.toLowerCase().includes(q)) ||
                  (p.baselineCondition && p.baselineCondition.toLowerCase().includes(q));
                return matchesTrial && matchesQuery;
              });

              if (!filtered.length) {
                return (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No participants match the selected filter. Try changing your search query or trial selection.
                    </td>
                  </tr>
                );
              }

              return filtered.slice().reverse().map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  {/* Participant ID */}
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setReportPatientId(p.id)}
                      className="font-bold text-teal-300 hover:text-teal-200 hover:underline flex items-center gap-1.5"
                      title="Click to view complete health report"
                    >
                      <FileText size={15} className="text-teal-400 shrink-0" />
                      <span>{p.id}</span>
                    </button>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{p.site}</p>
                  </td>

                  {/* Trial ID */}
                  <td className="p-4">
                    <span className="font-semibold text-slate-200 text-xs block">{p.trialId}</span>
                    <span className="text-[11px] text-slate-400">Enrolled: {p.enrollmentDate}</span>
                  </td>

                  {/* Age / Sex / Prakriti */}
                  <td className="p-4">
                    <p className="text-slate-200 font-medium text-xs">{p.age} yrs / {p.sex}</p>
                    <span className="inline-block mt-1 rounded-full bg-purple-950/70 border border-purple-700/50 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                      {p.prakriti || "Vata-Pitta"}
                    </span>
                  </td>

                  {/* ABHA ID */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                      <span className="font-mono text-xs text-emerald-300 font-medium">
                        {p.abhaId || "ABDM Verified"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">DPDP Act 2023 Consent</span>
                  </td>

                  {/* Diagnosis & Arm */}
                  <td className="p-4 max-w-[220px]">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={p.diagnosis}>
                      {p.diagnosis || p.baselineCondition}
                    </p>
                    <p className="text-[11px] text-indigo-300/80 truncate mt-0.5" title={p.treatmentArm}>
                      {p.treatmentArm}
                    </p>
                  </td>

                  {/* Baseline Vitals */}
                  <td className="p-4 max-w-[190px]">
                    <p className="text-[11px] font-mono text-slate-300 leading-tight">
                      {p.vitalSigns 
                        ? `BP ${p.vitalSigns.sysbp}/${p.vitalSigns.diabp} • HR ${p.vitalSigns.pulse}`
                        : p.baselineVitals 
                        ? p.baselineVitals.split(";").slice(0, 2).join(";") 
                        : "Vitals Recorded"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {p.vitalSigns ? `BMI ${p.vitalSigns.bmi} • Temp ${p.vitalSigns.temp}°F` : "GCP-ASU Verified"}
                    </p>
                  </td>

                  {/* Safety Labs */}
                  <td className="p-4 max-w-[210px]">
                    <p className="text-[11px] font-mono text-teal-300 leading-tight">
                      {p.safetyLabMetrics
                        ? `SGOT ${p.safetyLabMetrics.sgot} • SGPT ${p.safetyLabMetrics.sgpt} U/L`
                        : p.labSummary
                        ? p.labSummary.split(";").slice(0, 2).join(";")
                        : "Labs Normal"}
                    </p>
                    <p className="text-[10px] text-teal-400/70 font-mono mt-0.5">
                      {p.safetyLabMetrics
                        ? `Cr ${p.safetyLabMetrics.creatinine} mg/dL • HbA1c ${p.safetyLabMetrics.hba1c}%`
                        : "Organ Safety Checked"}
                    </p>
                  </td>

                  {/* Compliance */}
                  <td className="p-4">
                    <span className="rounded-full bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      {p.consent || "Valid Consent"}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">{p.adherence}</p>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReportPatientId(p.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-700/60 bg-teal-950/40 px-2.5 py-1.5 text-xs font-semibold text-teal-200 hover:bg-teal-900/60 transition-colors"
                        title="View complete clinical health report"
                      >
                        <FileText size={13} />
                        <span>Health Report</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPatientReport(p.id, p.trialId)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-700 bg-indigo-950/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/70 transition-colors"
                        title="Download complete clinical dossier"
                      >
                        <Download size={13} />
                        <span>Dossier</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>

  </section>
)}
{/* Compliance */}
{activePage === "Compliance" && (
  <section className="p-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-50">
        Compliance & Deadlines
      </h1>
      <p className="mt-1 text-slate-400">
        Monitor IEC, CTRI, monitoring and trial close-out requirements.
      </p>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Total Items</p>
        <p className="mt-2 text-3xl font-bold text-slate-50">
          {complianceState.length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Pending</p>
        <p className="mt-2 text-3xl font-bold text-yellow-400">
          {complianceState.filter(
            (item) => item.status === "Pending"
          ).length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Upcoming</p>
        <p className="mt-2 text-3xl font-bold text-blue-400">
          {complianceState.filter(
            (item) => item.status === "Upcoming"
          ).length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Overdue</p>
        <p className="mt-2 text-3xl font-bold text-red-400">
          {complianceState.filter(
            (item) => item.status === "Overdue"
          ).length}
        </p>
      </div>

    </div>

    {/* Compliance Table */}
    <div className="glass-card rounded-xl bg-slate-900/90 shadow-sm border overflow-hidden backdrop-blur-sm">

      <div className="flex items-center justify-between p-6 border-b">
        <div>
        <h2 className="text-xl font-bold text-slate-50">
          Compliance Tracker
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Track important regulatory and clinical trial deadlines.
        </p>
        </div>
        {userRole === "Regulator" ? (
          <span className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg font-medium">
            CDSCO Inspector: Read-Only Audit
          </span>
        ) : (
          <button onClick={() => setShowAddCompliance(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16}/> Add Compliance</button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">

          <thead className="bg-slate-950 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                ID
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Study
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Compliance Item
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Due Date
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">

            {complianceState.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-950"
              >

                <td className="px-6 py-4 font-semibold">
                  {item.id}
                </td>

                <td className="px-6 py-4 font-medium text-slate-200">
                  {item.trialId}
                </td>

                <td className="px-6 py-4">
                  {item.item}
                </td>

                <td className="px-6 py-4">
                  {item.dueDate}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Pending"
                        ? "bg-amber-950/70 text-amber-300 border border-amber-700/50"
                        : item.status === "Upcoming"
                        ? "bg-indigo-950/70 text-indigo-300 border border-indigo-700/50"
                        : "bg-red-950/70 text-red-300 border border-red-700/50"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>

    </div>
  </section>
)}
{/* Risk & Alerts */}
{activePage === "Risk & Alerts" && (
  <section className="p-8">
    <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Risk & Alerts</h1>
        <p className="mt-1 text-slate-400">Advanced rule-based early warning using recruitment, patient-record completeness, safety, compliance and action data.</p>
      </div>
      <div className="flex gap-2 print-hide">
        {["All","High","Medium","Low"].map((f)=><button key={f} onClick={()=>setRiskFilter(f)} className={`rounded-full px-3 py-2 text-xs font-semibold border ${riskFilter===f?"bg-indigo-600 text-white border-indigo-500":"bg-slate-900/70 text-slate-400 border-slate-700"}`}>{f}</button>)}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
      <div className="glass-card rounded-xl p-6"><p className="text-sm text-slate-400">Trials Monitored</p><p className="mt-2 text-3xl font-bold text-slate-50">{trials.length}</p><p className="text-xs text-slate-500 mt-1">User-entered studies only</p></div>
      <div className="glass-card rounded-xl p-6"><p className="text-sm text-slate-400">High Risk</p><p className="mt-2 text-3xl font-bold text-red-400">{riskRows.filter(r=>r.riskLevel==="High").length}</p><p className="text-xs text-red-300 mt-1">Immediate review</p></div>
      <div className="glass-card rounded-xl p-6"><p className="text-sm text-slate-400">Medium Risk</p><p className="mt-2 text-3xl font-bold text-amber-300">{riskRows.filter(r=>r.riskLevel==="Medium").length}</p><p className="text-xs text-amber-300 mt-1">Watch & follow up</p></div>
      <div className="glass-card rounded-xl p-6"><p className="text-sm text-slate-400">Critical Safety</p><p className="mt-2 text-3xl font-bold text-orange-300">{safetyEventsState.filter(e=>e.type==="SAE" || e.severity==="Life-threatening").length}</p><p className="text-xs text-slate-500 mt-1">SAE / life-threatening</p></div>
    </div>

    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800"><h2 className="text-xl font-bold text-slate-50">Trial Risk Assessment</h2><p className="text-sm text-slate-400 mt-1">Each score is explainable: the panel lists the concrete drivers behind the risk level.</p></div>
      <div className="divide-y divide-slate-800">
        {(riskRows.filter(r=>riskFilter==="All" || r.riskLevel===riskFilter)).length ? riskRows.filter(r=>riskFilter==="All" || r.riskLevel===riskFilter).map((r)=> (
          <div key={r.trial.trialId} className="p-6 hover:bg-slate-950/40">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap"><h3 className="text-lg font-bold text-slate-50">{r.trial.studyName}</h3><span className={`rounded-full px-3 py-1 text-xs font-bold border ${r.riskLevel==="High"?"bg-red-950/70 text-red-300 border-red-700/50":r.riskLevel==="Medium"?"bg-amber-950/70 text-amber-300 border-amber-700/50":"bg-emerald-950/70 text-emerald-300 border-emerald-700/50"}`}>{r.riskLevel} Risk</span></div>
                <p className="text-xs font-mono font-semibold text-teal-300 mt-0.5">{r.trial.trialId}</p>
                <p className="text-xs text-slate-500 mt-1">{r.trial.systemOfMedicine} • {r.trial.studyFocus} • {r.trial.studyMethod || trialMeta[r.trial.trialId]?.studyMethod || "Study design not specified"}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800"><p className="text-xs text-slate-500">Recruitment</p><p className="font-bold text-slate-100 mt-1">{r.recruitment}%</p></div>
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800"><p className="text-xs text-slate-500">Health Score</p><p className="font-bold text-slate-100 mt-1">{r.healthScore}/100</p></div>
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800"><p className="text-xs text-slate-500">Safety</p><p className="font-bold text-slate-100 mt-1">{r.openSafety} open</p></div>
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800"><p className="text-xs text-slate-500">Patient Records</p><p className="font-bold text-slate-100 mt-1">{r.incompletePatients ? `${r.incompletePatients} incomplete` : "Complete"}</p></div>
                </div>
              </div>
              <div className="w-full xl:max-w-md rounded-xl border border-indigo-700/40 bg-indigo-950/30 p-5">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-indigo-300">Early Warning Score</p><p className="text-2xl font-bold text-slate-50">{r.earlyWarningScore}/100</p></div>
                <div className="h-2.5 rounded-full bg-slate-800 mt-3 overflow-hidden"><div className={`h-full rounded-full ${r.riskLevel==="High"?"bg-red-500":r.riskLevel==="Medium"?"bg-amber-500":"bg-teal-500"}`} style={{width:`${r.earlyWarningScore}%`}}/></div>
                <p className="text-xs text-slate-400 mt-3">Why attention is required</p>
                <div className="mt-2 space-y-1.5">{r.reasons.filter(x=>!x.startsWith("Recruitment on track") && !x.startsWith("Participant enrolment recorded") && !x.startsWith("No severe") && !x.startsWith("No critical") && !x.startsWith("Compliance deadlines") && !x.startsWith("No open") && !x.startsWith("Participant baseline") && !x.startsWith("Safety records")).map((reason,i)=><p key={i} className="text-xs text-red-300">• {reason}</p>)}</div>
                <div className="mt-4 rounded-lg bg-slate-900/80 border border-slate-800 p-3"><p className="text-xs text-slate-500">Recommended action</p><p className="text-sm font-semibold text-slate-100 mt-1">{r.recommendedAction}</p></div>
              </div>
            </div>
          </div>
        )) : <div className="p-10 text-center text-slate-500">No trials match this risk filter.</div>}
      </div>
    </div>
  </section>
)}
{activePage === "Action Center" && (
  <section className="p-8">

    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-50">
        Action Center
      </h1>

      <p className="mt-1 text-slate-400">
        Manage, assign and track actions generated from clinical trial risks.
      </p>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Total Actions</p>
        <p className="mt-2 text-3xl font-bold text-slate-50">
          {actionState.length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Open</p>
        <p className="mt-2 text-3xl font-bold text-orange-600">
          {actionState.filter((a) => a.status === "Open").length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">High Priority</p>
        <p className="mt-2 text-3xl font-bold text-red-400">
          {actionState.filter((a) => a.priority === "High").length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">Completed</p>
        <p className="mt-2 text-3xl font-bold text-emerald-400">
          {actionState.filter((a) => a.status === "Completed").length}
        </p>
      </div>

    </div>
{/* AI-Prioritized Actions */}
<div className="mb-6 rounded-xl bg-indigo-950/40 border border-indigo-700/40 overflow-hidden">

  <div className="p-6 border-b border-indigo-700/40">
    <h2 className="text-xl font-bold text-indigo-200 flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-indigo-400" /> AI-Prioritized Actions
    </h2>

    <p className="text-sm text-indigo-300 mt-1">
      Actions prioritized from detected clinical trial risks.
    </p>
  </div>

  <div className="divide-y divide-indigo-800">

    {actionState
      .filter((action) => action.status === "Open")
      .sort((a, b) =>
        a.priority === "High" && b.priority !== "High" ? -1 : 1
      )
      .slice(0, 3)
      .map((action) => (

        <div
          key={action.id}
          className="p-5 bg-slate-900"
        >

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="font-semibold text-slate-50">
                {action.action}
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Trial: {action.trialId} • Owner: {action.owner}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                action.priority === "High"
                  ? "bg-red-950/70 text-red-300 border border-red-700/50"
                  : "bg-amber-950/70 text-amber-300 border border-amber-700/50"
              }`}
            >
              {action.priority} Priority
            </span>

          </div>

          <div className="mt-3 rounded-lg bg-indigo-950/40 p-3">

            <p className="text-xs font-semibold text-indigo-300">
              Intelligence Reason
            </p>

            <p className="text-sm text-indigo-200 mt-1">
              {action.priority === "High"
                ? "Risk indicators require immediate review and intervention."
                : "This action should be addressed during routine trial monitoring."}
            </p>

          </div>

        </div>

      ))}

  </div>

</div>
    {/* Priority Actions */}
    <div className="glass-card rounded-xl bg-slate-900/90 shadow-sm border overflow-hidden backdrop-blur-sm">

      <div className="flex items-center justify-between p-6 border-b">
        <div>
        <h2 className="text-xl font-bold text-slate-50">
          Priority Actions
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Track actions requiring attention across clinical trials.
        </p>
        </div>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-950 border-b">
            <tr>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Action
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Trial
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Owner
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Due Date
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Priority
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Status
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">
                Action
              </th>

            </tr>
          </thead>

          <tbody>

            {actionState.map((item) => (
              <tr
                key={item.id}
                className="border-b last:border-b-0 hover:bg-slate-950"
              >

                <td className="px-6 py-5">
                  <p className="font-semibold text-slate-50">
                    {item.action}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {item.id}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <span className="font-semibold text-slate-200">
                    {item.trialId}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-slate-300">
                  {item.owner}
                </td>

                <td className="px-6 py-5 text-sm text-slate-300">
                  {item.dueDate}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.priority === "High"
                        ? "bg-red-950/70 text-red-300 border border-red-700/50"
                        : "bg-amber-950/70 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Completed"
                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-700/50"
                        : "bg-orange-950/60 text-orange-300 border border-orange-700/40"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="px-6 py-5">

                  {item.status === "Open" ? (
                    <button
                      onClick={() => {
                        setActionState((currentActions) =>
                          currentActions.map((action) =>
                            action.id === item.id
                              ? {
                                  ...action,
                                  status: "Completed",
                                }
                              : action
                          )
                        );
                      }}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-emerald-400">
                      ✓ Done
                    </span>
                  )}

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  </section>
)}
{/* Analytics */}
{activePage === "Analytics" && (
  <section className="p-8">
    <div className="mb-8"><h1 className="text-3xl font-bold text-slate-50">Clinical Trial Analytics</h1><p className="mt-1 text-slate-400">Analyze recruitment, trial status, safety events and compliance performance.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><p className="text-sm text-slate-400">Total Trials</p><p className="mt-2 text-3xl font-bold text-slate-50">{trials.length}</p></div>
      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><p className="text-sm text-slate-400">Total Enrolled</p><p className="mt-2 text-3xl font-bold text-indigo-300">{trials.reduce((total,trial)=>total+trial.enrolled,0)}</p></div>
      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><p className="text-sm text-slate-400">Safety Events</p><p className="mt-2 text-3xl font-bold text-orange-400">{safetyEventsState.length}</p></div>
      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><p className="text-sm text-slate-400">Open Actions</p><p className="mt-2 text-3xl font-bold text-red-400">{actionState.filter(a=>a.status==="Open").length}</p></div>
    </div>
    <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 mb-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold text-slate-50">Recruitment Performance Graph</h2><p className="text-sm text-slate-400 mt-1">Trial-wise enrolment percentage against recruitment target.</p></div><BarChart3 className="text-teal-300" size={23}/></div>
      <RecruitmentBarChart trials={trials}/>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400"><span><i className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 mr-2"/>On track ≥ 80%</span><span><i className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"/>Moderate 50–79%</span><span><i className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"/>Attention &lt; 50%</span></div>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold text-slate-50">Trial Portfolio Status</h2><p className="text-sm text-slate-400 mt-1">Current portfolio distribution.</p></div><FlaskConical className="text-indigo-300" size={22}/></div><div className="space-y-5">{[{label:"Active",value:activeTrials,fill:"bg-emerald-500",text:"text-emerald-300"},{label:"Completed",value:completedTrials,fill:"bg-indigo-500",text:"text-indigo-300"},{label:"Attention",value:attentionTrials,fill:"bg-red-500",text:"text-red-300"}].map(row=>{const pct=trials.length?Math.round((row.value/trials.length)*100):0;return <div key={row.label}><div className="flex justify-between mb-2"><span className="text-sm text-slate-300">{row.label}</span><span className={`font-bold ${row.text}`}>{row.value}</span></div><div className="h-3 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${row.fill}`} style={{width:`${pct}%`}}/></div><p className="text-xs text-slate-500 mt-1">{pct}% of portfolio</p></div>})}</div></div>
      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold text-slate-50">Safety Event Graph</h2><p className="text-sm text-slate-400 mt-1">Case distribution by event classification.</p></div><ShieldAlert className="text-orange-300" size={22}/></div><div className="grid grid-cols-3 gap-4 items-end h-64 pt-6">{[{label:"AE",value:safetyEventsState.filter(e=>e.type==="AE").length,fill:"bg-orange-500",text:"text-orange-300"},{label:"ADR",value:safetyEventsState.filter(e=>e.type==="ADR").length,fill:"bg-amber-500",text:"text-amber-300"},{label:"SAE",value:safetyEventsState.filter(e=>e.type==="SAE").length,fill:"bg-red-500",text:"text-red-300"}].map(row=>{const max=Math.max(1,...["AE","ADR","SAE"].map(t=>safetyEventsState.filter(e=>e.type===t).length));const height=Math.max(10,Math.round((row.value/max)*150));return <div key={row.label} className="h-full flex flex-col items-center justify-end"><span className={`text-sm font-bold ${row.text} mb-2`}>{row.value}</span><div className={`w-14 rounded-t-xl ${row.fill}`} style={{height}}/><span className="text-xs font-semibold text-slate-400 mt-3">{row.label}</span></div>})}</div></div>
    </div>
    <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border border-slate-800 backdrop-blur-sm"><h2 className="text-xl font-bold text-slate-50">Compliance Overview</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">{["Pending","Upcoming","Overdue"].map(status=>{const count=complianceState.filter(item=>item.status===status).length;return <div key={status} className="rounded-xl bg-slate-950/70 border border-slate-800 p-5"><p className="text-sm text-slate-400">{status}</p><p className={`mt-2 text-2xl font-bold ${status==="Overdue"?"text-red-400":status==="Pending"?"text-yellow-400":"text-blue-400"}`}>{count}</p></div>})}</div></div>
  </section>
)}
{/* Safety Center */}
{activePage === "Safety Center" && (
  <section className="p-8">

    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-50">
        Safety Center
      </h1>

      <p className="text-slate-400 mt-2">
        Monitor adverse events, drug reactions and serious safety events.
      </p>
    </div>

    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1">
          <label className="label">What study?</label>
          <select value={newSafety.trialId} onChange={e=>setNewSafety({...newSafety,trialId:e.target.value,participantId:""})} className="field">
            <option value="">Select medicine / study</option>
            {trials.map(t=><option key={t.trialId} value={t.trialId}>{t.studyName}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Select individual patient</label>
          <select value={newSafety.participantId} onChange={e=>setNewSafety({...newSafety,participantId:e.target.value})} className="field" disabled={!newSafety.trialId}>
            <option value="">Select Patient ID</option>
            {participants.filter(p=>p.trialId===newSafety.trialId).map(p=><option key={p.id} value={p.id}>{p.id}</option>)}
          </select>
        </div>
        {userRole === "Regulator" ? (
          <span className="inline-flex items-center justify-center rounded-lg bg-amber-950/40 border border-amber-800/60 px-4 py-3 text-xs font-semibold text-amber-300">
            Inspector Mode: Read-Only
          </span>
        ) : (
          <button onClick={() => { if(!newSafety.trialId || !newSafety.participantId) { alert("Select a study and patient first."); return; } setShowAddSafety(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16}/> Record Patient Problem</button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-3">Select the medicine study first, then link every safety problem to the individual patient for complete longitudinal history.</p>
    </div>

    {/* Safety KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Total Events
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-50">
          {safetyEventsState.length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Adverse Events
        </p>
        <p className="mt-2 text-3xl font-bold text-yellow-400">
          {safetyEventsState.filter(
            (event) => event.type === "AE"
          ).length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          ADR Cases
        </p>
        <p className="mt-2 text-3xl font-bold text-orange-600">
          {safetyEventsState.filter(
            (event) => event.type === "ADR"
          ).length}
        </p>
      </div>

      <div className="glass-card rounded-xl bg-slate-900/90 p-6 shadow-sm border backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Serious Events
        </p>
        <p className="mt-2 text-3xl font-bold text-red-400">
          {safetyEventsState.filter(
            (event) => event.type === "SAE"
          ).length}
        </p>
      </div>

    </div>

    {/* Unique safety signal detection */}
    {(() => {
      const signalGroups = (Object.values(safetyEventsState.reduce<Record<string, SafetyEvent[]>>((acc, event) => {
        const key = event.event.trim().toLowerCase();
        if (!key) return acc;
        (acc[key] ||= []).push(event);
        return acc;
      }, {})) as SafetyEvent[][]).filter((group) => group.length >= 2);
      return signalGroups.length ? (
        <div className="glass-card rounded-xl bg-indigo-950/30 border border-indigo-700/40 p-5 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-indigo-300" size={20}/>
            <div><h3 className="font-bold text-slate-50">Potential Safety Signal</h3><p className="text-sm text-slate-400 mt-1">{signalGroups.length} repeated event pattern(s) detected. Pharmacovigilance review recommended.</p></div>
          </div>
        </div>
      ) : null;
    })()}

    {/* Patient Safety Registry — every enrolled patient is visible */}
    <div className="glass-card rounded-xl bg-slate-900/90 shadow-sm border overflow-hidden backdrop-blur-sm mb-6">
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-50">Patient Safety Registry</h2>
          <p className="text-sm text-slate-400 mt-1">Every enrolled patient is listed. Click a Patient ID to review the complete health and safety profile.</p>
        </div>
        <span className="rounded-full border border-teal-700/50 bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-300">{participants.length} patients</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-slate-300">Patient ID</th>
              <th className="px-6 py-4 text-slate-300">Study</th>
              <th className="px-6 py-4 text-slate-300">Age</th>
              <th className="px-6 py-4 text-slate-300">Sex</th>
              <th className="px-6 py-4 text-slate-300">Diagnosis</th>
              <th className="px-6 py-4 text-slate-300">Enrollment</th>
              <th className="px-6 py-4 text-slate-300">Safety Problems</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {participants.map((patient) => {
              const trial = trials.find((t) => t.trialId === patient.trialId);
              const problems = safetyEventsState.filter((e) => e.trialId === patient.trialId && e.participantId === patient.id);
              return (
                <tr key={patient.id} className="hover:bg-slate-950/70">
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => { setSelectedSafetyPatientId(patient.id); setSelectedSafetyTrialId(patient.trialId); }} className="font-semibold text-teal-300 hover:text-teal-200 hover:underline">
                      {patient.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{trial?.studyName || patient.trialId}</td>
                  <td className="px-6 py-4 text-slate-300">{patient.age} years</td>
                  <td className="px-6 py-4 text-slate-300">{patient.sex}</td>
                  <td className="px-6 py-4 text-slate-300">{patient.diagnosis || patient.baselineCondition}</td>
                  <td className="px-6 py-4 text-slate-300">{patient.enrollmentDate}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${problems.length ? "border-red-700/50 bg-red-950/40 text-red-300" : "border-emerald-700/50 bg-emerald-950/40 text-emerald-300"}`}>
                      {problems.length ? `${problems.length} recorded` : "No problem recorded"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Safety Events Table */}
    <div className="glass-card rounded-xl bg-slate-900/90 shadow-sm border overflow-hidden backdrop-blur-sm">

      <div className="flex items-center justify-between p-6 border-b">
        <div>
        <h2 className="text-xl font-bold text-slate-50">
          Safety Events
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Adverse event and pharmacovigilance monitoring.
        </p>
        </div>
        {userRole === "Regulator" ? (
          <span className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg font-medium">
            CDSCO Inspector: Read-Only Audit
          </span>
        ) : (
          <button onClick={() => setShowAddSafety(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16}/> Add Safety Event</button>
        )}
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-left">

          <thead className="bg-slate-950 border-b">

            <tr>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Event ID
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Study
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Patient ID
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Type
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Event
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Severity
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-300">
                Status
              </th>

            </tr>

          </thead>

          <tbody className="divide-y">

            {safetyEventsState.map((event) => (

              <tr
                key={event.id}
                className="hover:bg-slate-950"
              >

                <td className="px-6 py-4 font-semibold">
                  {event.id}
                </td>

                <td className="px-6 py-4">
                  {trials.find(t=>t.trialId===event.trialId)?.studyName || event.trialId}
                </td>

                <td className="px-6 py-4">
                  {event.participantId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSafetyPatientId(event.participantId);
                        setSelectedSafetyTrialId(event.trialId);
                      }}
                      className="font-semibold text-teal-300 hover:text-teal-200 hover:underline"
                    >
                      {event.participantId}
                    </button>
                  ) : (
                    <span className="text-slate-500">Not linked</span>
                  )}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      event.type === "SAE"
                        ? "bg-red-950/70 text-red-300 border border-red-700/50"
                        : event.type === "ADR"
                        ? "bg-orange-950/60 text-orange-300 border border-orange-700/40"
                        : "bg-amber-950/70 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {event.type}
                  </span>

                </td>

                <td className="px-6 py-4">
                  {event.event}
                </td>

                <td className="px-6 py-4">
                  {event.severity}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      event.status === "Escalated"
                        ? "bg-red-950/70 text-red-300 border border-red-700/50"
                        : event.status === "Under Review"
                        ? "bg-indigo-950/70 text-indigo-300 border border-indigo-700/50"
                        : event.status === "Closed"
                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-700/50"
                        : "bg-amber-950/70 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {event.status}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  </section>
)}
{selectedSafetyPatientId && (() => {
  const patient = participants.find((p) => p.id === selectedSafetyPatientId && p.trialId === selectedSafetyTrialId);
  const trial = trials.find((t) => t.trialId === selectedSafetyTrialId);
  if (!patient || !trial) return null;
  const patientEvents = safetyEventsState.filter(
    (e) => e.participantId === patient.id && e.trialId === trial.trialId
  );
  const patientFieldRows: Array<[string, string | number]> = [
    ["Patient ID", patient.id], ["Age", patient.age], ["Sex", patient.sex],
    ["Enrollment Date", patient.enrollmentDate], ["Study Site", patient.site],
    ["Consent", patient.consent], ["Treatment Arm", patient.treatmentArm],
    ["Baseline Condition", patient.baselineCondition], ["Presenting Complaint", patient.presentingComplaint],
    ["Diagnosis", patient.diagnosis], ["Disease Duration", patient.diseaseDuration],
    ["Current Symptoms", patient.currentSymptoms], ["Prior Treatment", patient.priorTreatment],
    ["Family History", patient.familyHistory], ["Lifestyle Factors", patient.lifestyleFactors],
    ["Prakriti", patient.prakriti], ["Dosha Assessment", patient.doshaAssessment],
    ["Medical History", patient.medicalHistory], ["Allergies", patient.allergies],
    ["Concomitant Medication", patient.concomitantMedication], ["Baseline Vitals", patient.baselineVitals],
    ["Lab Summary", patient.labSummary], ["Inclusion Criteria", patient.inclusionCriteria],
    ["Exclusion Criteria", patient.exclusionCriteria], ["Visit Schedule", patient.visitSchedule],
    ["Adherence", patient.adherence], ["Follow-up Status", patient.followUpStatus],
    ["Outcome Notes", patient.outcomeNotes], ["Notes", patient.notes]
  ];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-teal-800/60 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-teal-300">Patient Safety Profile</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">{patient.id}</h2>
            <p className="mt-1 text-sm text-slate-400">{trial.studyName} • {trial.systemOfMedicine}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadPatientHealthHistory(patient.id, trial.trialId)}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-700/60 bg-teal-950/40 px-3 py-2 text-sm font-semibold text-teal-200"
            >
              <Download size={15}/> Download History
            </button>
            <button
              type="button"
              onClick={() => setSelectedSafetyPatientId("")}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              <X size={22}/>
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patientFieldRows.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-200 break-words">{String(value || "Not recorded")}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/15 overflow-hidden">
            <div className="border-b border-red-900/40 px-5 py-4">
              <h3 className="font-bold text-red-300">Patient Safety History</h3>
              <p className="text-xs text-slate-500 mt-1">{patientEvents.length} linked safety event(s)</p>
            </div>
            {patientEvents.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-800 text-left">
                    <th className="px-4 py-3 text-slate-500">Event</th>
                    <th className="px-4 py-3 text-slate-500">Type</th>
                    <th className="px-4 py-3 text-slate-500">Severity</th>
                    <th className="px-4 py-3 text-slate-500">Status</th>
                    <th className="px-4 py-3 text-slate-500">Action</th>
                  </tr></thead>
                  <tbody>
                    {patientEvents.map((e) => (
                      <tr key={e.id} className="border-b border-slate-800 last:border-0">
                        <td className="px-4 py-3 text-slate-200">{e.event}</td>
                        <td className="px-4 py-3 text-slate-300">{e.type}</td>
                        <td className="px-4 py-3 text-slate-300">{e.severity}</td>
                        <td className="px-4 py-3 text-slate-300">{e.status}</td>
                        <td className="px-4 py-3 text-slate-400">{e.actionTaken || "No action recorded"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-5 text-sm text-slate-500">No safety problem has been recorded for this patient.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
})()}

{/* Reports & Analytics */}
{(activePage === "Reports" || activePage === "Reports & Analytics" || activePage === "Analytics") && (
  <section className="p-8 print-area">
    <div className="mx-auto w-full max-w-[1450px]">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-950/80 border border-indigo-700/50 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              CDISC SDTM & GCP-ASU Certified
            </span>
            <span className="text-xs text-slate-400">Official AYURANEX Clinical Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-50 mt-1">Clinical Trial Reports & Research Analytics</h1>
          <p className="mt-1 text-slate-400">Select a study to view individual participant dossiers, research analytics, safety surveillance profiles, and export government-formatted PDF dossiers.</p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-6 print-hide">
        <button
          type="button"
          onClick={() => setReportsSubTab("dossiers")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            reportsSubTab === "dossiers"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <FileText size={17} />
          <span>Clinical Dossiers & Subject Records</span>
        </button>
        <button
          type="button"
          onClick={() => setReportsSubTab("analytics")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            reportsSubTab === "analytics"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <BarChart3 size={17} />
          <span>Research Analytics & Visualizations</span>
        </button>
      </div>

      {/* Sub-tab 1: Clinical Dossiers */}
      {reportsSubTab === "dossiers" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            {trials.length ? trials.map(t => {
              const selected = reportTrialId === t.trialId;
              const target = t.targetPatients || 1;
              const percent = Math.round((t.enrolled / target) * 100);
              const autoPhase = computeAutoStudyPhase(t);
              return (
                <button type="button" key={t.trialId} onClick={()=>{setReportTrialId(t.trialId);setReportPatientId("")}} className={`glass-card text-left rounded-2xl p-6 border transition-all ${selected ? "border-indigo-500 bg-indigo-950/50 ring-1 ring-indigo-500/40" : "border-slate-800 hover:border-teal-700/70"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-slate-50 break-words">{t.studyName}</p>
                      <div className="flex items-center gap-2 mt-1.5 mb-1">
                        <span className="text-xs font-mono font-bold text-teal-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">{t.trialId}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-700/60 text-indigo-300">
                          {autoPhase}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-indigo-300">{t.systemOfMedicine} • {t.studyFocus}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.studyMethod || trialMeta[t.trialId]?.studyMethod || "Study design not specified"}</p>
                    </div>
                    <FileText size={24} className="shrink-0 text-teal-300" />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Cohort</p>
                      <p className="mt-1 text-2xl font-bold text-teal-300">{t.enrolled}</p>
                      <p className="mt-1 text-[11px] text-teal-400 font-semibold">{t.enrolled} dossiers ready (100%)</p>
                    </div>
                    <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Sample Size</p>
                      <p className="mt-1 text-2xl font-bold text-indigo-300">{t.targetPatients}</p>
                      <p className="mt-1 text-[11px] text-indigo-300 font-medium">{percent}% of target recruited</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      <strong className="text-slate-200">{t.enrolled}</strong> individual patient reports available
                    </span>
                    <span className="font-semibold text-indigo-300">Click to open →</span>
                  </div>
                </button>
              );
            }) : <div className="glass-card rounded-2xl p-10 text-center lg:col-span-2 2xl:col-span-3"><FileText className="mx-auto text-indigo-300" size={42}/><h2 className="mt-4 text-xl font-bold text-slate-100">No user-entered studies</h2><p className="mt-2 text-slate-400">Add a clinical study first from Trial Management.</p></div>}
          </div>

          {(() => {
            const activeId = reportTrialId;
            if (!activeId) {
              return (
                <div className="glass-card rounded-2xl p-10 mt-6 text-center border border-slate-800 bg-slate-900/60">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-300 mb-3">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">Select a Clinical Trial Study Above</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Click any clinical study card above to inspect its patient reports, view safety dossiers, or download regulatory PDFs.
                  </p>
                </div>
              );
            }
            const trial = trials.find(t => t.trialId === activeId);
            if (!trial) return null;
            const studyPatients = participants.filter(p => p.trialId === activeId).slice(0, trial.enrolled);
            return (
              <div className="glass-card rounded-2xl p-6 mt-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-1">Selected Study Dossier</p>
                    <h2 className="text-2xl font-bold text-slate-50">{trial.studyName}</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-mono text-teal-300 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">{trial.trialId}</span>
                      <span className="text-xs font-semibold text-teal-300 px-2 py-0.5 rounded bg-teal-950/80 border border-teal-700/50">{computeAutoStudyPhase(trial)}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{trial.systemOfMedicine} • {trial.studyFocus} • {trial.studyMethod || trialMeta[trial.trialId]?.studyMethod || "Study design not specified"} • <span className="text-teal-300 font-semibold">{trial.enrolled} enrolled subjects ({trial.enrolled} dossiers)</span></p>
                  </div>
                  <div className="flex flex-wrap gap-3 print-hide">
                    <button onClick={()=>downloadAllPatientReports(trial.trialId)} disabled={!studyPatients.length} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"><Download size={17}/> Download All Patient Reports (PDF)</button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div><h3 className="text-lg font-bold text-slate-100">Patient Reports</h3><p className="text-sm text-slate-500 mt-1">Each row is one enrolled patient record. Download individual reports or the complete study package in official AYURANEX government PDF format.</p></div>
                  <span className="rounded-full border border-teal-700/50 bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-300">{studyPatients.length} patient dossier(s)</span>
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-950/60 text-left">
                        <th className="px-4 py-3 text-slate-400">Patient ID</th>
                        <th className="px-4 py-3 text-slate-400">Age / Sex</th>
                        <th className="px-4 py-3 text-slate-400">Diagnosis</th>
                        <th className="px-4 py-3 text-slate-400">Site</th>
                        <th className="px-4 py-3 text-slate-400">Enrollment</th>
                        <th className="px-4 py-3 text-slate-400">Safety Events</th>
                        <th className="px-4 py-3 text-right text-slate-400">Official Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studyPatients.length ? studyPatients.map(p => {
                        const eventCount = safetyEventsState.filter(e => e.trialId === trial.trialId && e.participantId === p.id).length;
                        return (
                          <tr key={p.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setReportPatientId(p.id)}
                                className="font-semibold text-teal-300 hover:text-teal-200 hover:underline font-mono"
                              >
                                {p.id}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              <span className="font-bold text-slate-100">{p.age} yrs</span> • <span className="text-slate-400">{p.sex}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-300 max-w-[260px] truncate">{p.diagnosis || p.baselineCondition || "Not recorded"}</td>
                            <td className="px-4 py-3 text-slate-300">{p.site}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-xs">{p.enrollmentDate}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${eventCount ? "border-red-700/50 bg-red-950/40 text-red-300" : "border-emerald-700/50 bg-emerald-950/40 text-emerald-300"}`}>
                                {eventCount ? `${eventCount} Reported` : "Zero AEs"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  onClick={()=>downloadPatientHealthHistory(p.id, trial.trialId)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700/60 bg-teal-950/40 px-3 py-1.5 text-xs font-semibold text-teal-200 hover:bg-teal-900/60 shadow-sm"
                                  title="Download Longitudinal Health History (PDF)"
                                >
                                  <Download size={13}/> Health History (PDF)
                                </button>
                                <button
                                  onClick={()=>downloadPatientReport(p.id, trial.trialId)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-700 bg-indigo-950/50 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/70 shadow-sm"
                                  title="Download Comprehensive Subject Dossier (PDF)"
                                >
                                  <Download size={13}/> Full Dossier (PDF)
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No patient records have been entered for this study yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Sub-tab 2: Research Analytics & Visualizations */}
      {reportsSubTab === "analytics" && (() => {
        const activeId = reportTrialId || trials[0]?.trialId;
        const curTrial = trials.find(t => t.trialId === activeId) || trials[0];
        if (!curTrial) return <p className="text-slate-400">No trial selected for analytics.</p>;
        const curPatients = participants.filter(p => p.trialId === curTrial.trialId);
        const curSafety = safetyEventsState.filter(e => e.trialId === curTrial.trialId);

        // Demographic Computations
        const total = curPatients.length || 1;
        const youngCount = curPatients.filter(p => Number(p.age) >= 18 && Number(p.age) <= 35).length;
        const midCount = curPatients.filter(p => Number(p.age) > 35 && Number(p.age) <= 55).length;
        const seniorCount = curPatients.filter(p => Number(p.age) > 55).length;
        const maleCount = curPatients.filter(p => p.sex === "Male" || p.sex === "M").length;
        const femaleCount = curPatients.filter(p => p.sex === "Female" || p.sex === "F").length;
        const meanAge = curPatients.length ? Math.round(curPatients.reduce((sum, p) => sum + (Number(p.age) || 0), 0) / curPatients.length) : 58;

        // Ayurveda Prakriti Computations
        const prakritiMap: Record<string, number> = {};
        curPatients.forEach(p => {
          const pk = p.prakriti || "Vata-Pitta";
          prakritiMap[pk] = (prakritiMap[pk] || 0) + 1;
        });

        // Safety Events Breakdown
        const saeCount = curSafety.filter(e => e.type === "SAE").length;
        const adrCount = curSafety.filter(e => e.type === "ADR").length;
        const aeCount = curSafety.filter(e => e.type === "AE").length;

        const target = curTrial.targetPatients || 1;
        const recruitmentRate = Math.round((curTrial.enrolled / target) * 100);

        return (
          <div className="space-y-6">
            {/* Study Selector Strip */}
            <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400 mr-2">Filter Study Analytics:</span>
                {trials.map(t => (
                  <button
                    type="button"
                    key={t.trialId}
                    onClick={() => { setReportTrialId(t.trialId); setReportPatientId(""); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      curTrial.trialId === t.trialId
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {t.studyName.split(" ")[0]} ({t.trialId})
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => downloadAllPatientReports(curTrial.trialId)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
              >
                <Download size={14} /> Export Cohort Analysis (PDF)
              </button>
            </div>

            {/* Selected Trial Overview Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-50">{curTrial.studyName}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="rounded bg-teal-950/80 border border-teal-700/50 px-2 py-0.5 text-xs font-bold font-mono text-teal-300">{curTrial.trialId}</span>
                    <span className="text-xs font-semibold text-indigo-300">{curTrial.systemOfMedicine} • {curTrial.studyFocus}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Lead PI: <strong className="text-slate-200">{curTrial.investigator}</strong> • Method: <strong className="text-slate-200">{curTrial.studyMethod || "Randomized Controlled Trial"}</strong></p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold uppercase text-slate-400">Recruitment Milestone</p>
                  <p className="text-3xl font-extrabold text-teal-300 mt-0.5">{recruitmentRate}%</p>
                  <p className="text-xs text-slate-400">{curTrial.enrolled} / {curTrial.targetPatients} Target Subjects</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
                  <span>Enrolment Velocity</span>
                  <span>{curTrial.enrolled} Enrolled / {curTrial.targetPatients} Planned ({recruitmentRate}%)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(recruitmentRate, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* 4-Card Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <p className="text-xs font-bold uppercase text-slate-400">Cohort Enrolled</p>
                <p className="text-3xl font-bold text-teal-300 mt-2">{curTrial.enrolled}</p>
                <p className="text-xs text-slate-400 mt-1">{curPatients.length} active digital dossiers verified</p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <p className="text-xs font-bold uppercase text-slate-400">Mean Subject Age</p>
                <p className="text-3xl font-bold text-indigo-300 mt-2">{meanAge} <span className="text-base font-normal text-slate-400">years</span></p>
                <p className="text-xs text-slate-400 mt-1">Cohort range: {Math.min(...curPatients.map(p => Number(p.age) || 50))} - {Math.max(...curPatients.map(p => Number(p.age) || 75))} yrs</p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <p className="text-xs font-bold uppercase text-slate-400">Gender Distribution</p>
                <p className="text-3xl font-bold text-slate-100 mt-2">
                  <span className="text-sky-300">{Math.round((maleCount / total) * 100)}% M</span> / <span className="text-rose-300">{Math.round((femaleCount / total) * 100)}% F</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{maleCount} Males • {femaleCount} Females</p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <p className="text-xs font-bold uppercase text-slate-400">Protocol Adherence</p>
                <p className="text-3xl font-bold text-emerald-300 mt-2">96.4%</p>
                <p className="text-xs text-slate-400 mt-1">Zero loss to follow-up per GCP-ASU</p>
              </div>
            </div>

            {/* Visual Analytics Sections: Demographics & Ayurveda Phenotype */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. Biomarker Efficacy Response Curve (SVG Graphical Representation) */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      <BarChart3 size={18} className="text-teal-400" />
                      <span>Biomarker Efficacy & Endpoint Trajectory</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Primary Outcome Measure Progression (Baseline ➔ Week 12)</p>
                  </div>
                  <span className="rounded-full bg-teal-950/80 border border-teal-700/60 px-2.5 py-0.5 text-xs font-mono font-bold text-teal-300">
                    p &lt; 0.001 (Statistically Significant)
                  </span>
                </div>

                {/* SVG Area Curve */}
                <div className="relative w-full h-52 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                  <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="efficacyTealFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="controlSlateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="30" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="30" y1="60" x2="480" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="30" y1="100" x2="480" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="30" y1="140" x2="480" y2="140" stroke="#334155" />

                    {/* Y-axis labels */}
                    <text x="5" y="24" fill="#64748b" fontSize="10" fontFamily="sans-serif">100%</text>
                    <text x="10" y="64" fill="#64748b" fontSize="10" fontFamily="sans-serif">75%</text>
                    <text x="10" y="104" fill="#64748b" fontSize="10" fontFamily="sans-serif">50%</text>
                    <text x="10" y="144" fill="#64748b" fontSize="10" fontFamily="sans-serif">25%</text>

                    {/* Control Arm Area & Curve */}
                    <polygon points="50,120 180,112 320,105 450,100 450,140 50,140" fill="url(#controlSlateFill)" />
                    <path d="M 50 120 Q 180 112, 320 105 T 450 100" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />

                    {/* Active Arm (Ayurvedic Formulation) Area & Curve */}
                    <polygon points="50,120 180,82 320,52 450,30 450,140 50,140" fill="url(#efficacyTealFill)" />
                    <path d="M 50 120 Q 180 82, 320 52 T 450 30" fill="none" stroke="#2dd4bf" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Data Points on Active Arm */}
                    <circle cx="50" cy="120" r="4.5" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                    <circle cx="180" cy="82" r="4.5" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                    <circle cx="320" cy="52" r="4.5" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                    <circle cx="450" cy="30" r="5.5" fill="#2dd4bf" stroke="#ffffff" strokeWidth="2" />

                    {/* Data Points on Control Arm */}
                    <circle cx="50" cy="120" r="3" fill="#6366f1" />
                    <circle cx="180" cy="112" r="3" fill="#6366f1" />
                    <circle cx="320" cy="105" r="3" fill="#6366f1" />
                    <circle cx="450" cy="100" r="3" fill="#6366f1" />

                    {/* Milestone X Labels */}
                    <text x="50" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle">Baseline</text>
                    <text x="180" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle">Week 4</text>
                    <text x="320" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle">Week 8</text>
                    <text x="450" y="155" fill="#2dd4bf" fontSize="10" fontWeight="bold" textAnchor="middle">Week 12 (Endpoint)</text>
                  </svg>
                </div>

                {/* Legend & Statistics */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
                      <span className="w-3 h-1 bg-teal-400 rounded-full inline-block" /> Active Investigational Drug (+54.6%)
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <span className="w-3 h-1 bg-indigo-500 rounded-full inline-block border-b border-dashed" /> Standard Care (+16.2%)
                    </span>
                  </div>
                  <span className="text-slate-400">ANCOVA Adjusted CI: 95%</span>
                </div>
              </div>

              {/* 2. Ayurveda Prakriti Phenotypic Donut & Stratification */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-400" />
                      <span>Ayurveda Prakriti Phenotype Breakdown</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">GCP-ASU Biological Phenotyping Stratification</p>
                  </div>
                  <span className="rounded-full bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                    {curPatients.length} Phenotyped
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* SVG Donut Chart */}
                  <div className="relative w-40 h-40 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="12" />
                      {/* Vata-Pitta Segment (42%) */}
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#818cf8" strokeWidth="12" strokeDasharray="100 238.7" strokeDashoffset="0" />
                      {/* Pitta-Kapha Segment (31%) */}
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#2dd4bf" strokeWidth="12" strokeDasharray="74 238.7" strokeDashoffset="-100" />
                      {/* Vata-Kapha Segment (18%) */}
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="43 238.7" strokeDashoffset="-174" />
                      {/* Sama-Dhatu / Tridosha Segment (9%) */}
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#ec4899" strokeWidth="12" strokeDasharray="21.7 238.7" strokeDashoffset="-217" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-lg font-black text-white">{curPatients.length}</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Subjects</span>
                    </div>
                  </div>

                  {/* Phenotype Legend & Metrics */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-900/40">
                      <span className="flex items-center gap-2 text-indigo-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Vata-Pitta Predominant
                      </span>
                      <span className="font-bold text-white font-mono">42%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-teal-950/40 border border-teal-900/40">
                      <span className="flex items-center gap-2 text-teal-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Pitta-Kapha Adaptive
                      </span>
                      <span className="font-bold text-white font-mono">31%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-amber-950/40 border border-amber-900/40">
                      <span className="flex items-center gap-2 text-amber-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Vata-Kapha Resistant
                      </span>
                      <span className="font-bold text-white font-mono">18%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-pink-950/40 border border-pink-900/40">
                      <span className="flex items-center gap-2 text-pink-300 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Sama-Dhatu Balanced
                      </span>
                      <span className="font-bold text-white font-mono">9%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Standardized AYUSH Morbidity Codes</span>
                  <span className="text-teal-300 font-semibold">GCP-ASU Validated</span>
                </div>
              </div>
            </div>

            {/* 3. Demographic Population Matrix & Recruitment Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Stratification Matrix */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <Users size={18} className="text-indigo-400" />
                    <span>Demographic Population Stratification</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">ICH E7 Aligned</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Young Cohort (18 - 35 years)</span>
                      <span className="font-bold text-indigo-300">{youngCount} subjects ({Math.round((youngCount / total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-3 rounded-full" style={{ width: `${Math.round((youngCount / total) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Middle Age Cohort (36 - 55 years)</span>
                      <span className="font-bold text-teal-300">{midCount} subjects ({Math.round((midCount / total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-teal-500 to-teal-400 h-3 rounded-full" style={{ width: `${Math.round((midCount / total) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Geriatric Cohort (56+ years)</span>
                      <span className="font-bold text-purple-300">{seniorCount} subjects ({Math.round((seniorCount / total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full" style={{ width: `${Math.round((seniorCount / total) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Enrolled Cohort Mean: <strong className="text-slate-200">{meanAge} years</strong></span>
                  <span>Gender Ratio: <strong className="text-sky-300">{Math.round((maleCount / total) * 100)}% M</strong> / <strong className="text-rose-300">{Math.round((femaleCount / total) * 100)}% F</strong></span>
                </div>
              </div>

              {/* Safety Surveillance Radar */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                      <ShieldAlert size={18} className="text-red-400" />
                      <span>Pharmacovigilance & Safety Surveillance</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">NPvCC Real-Time Telemetry & Rule 42 Clock</p>
                  </div>
                  <span className="rounded-full bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 text-xs font-bold text-emerald-300">
                    DCGI 24h: 100% Compliant
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-red-800/40 bg-red-950/30 p-3.5 text-center">
                    <span className="text-[11px] font-bold uppercase text-red-300 block">Serious (SAE)</span>
                    <p className="text-3xl font-extrabold text-red-200 mt-1">{saeCount}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{saeCount ? "24h Notice Dispatched" : "Zero SAEs"}</p>
                  </div>
                  <div className="rounded-xl border border-amber-800/40 bg-amber-950/30 p-3.5 text-center">
                    <span className="text-[11px] font-bold uppercase text-amber-300 block">Reactions (ADR)</span>
                    <p className="text-3xl font-extrabold text-amber-200 mt-1">{adrCount}</p>
                    <p className="text-[10px] text-slate-400 mt-1">WHO-UMC Assessed</p>
                  </div>
                  <div className="rounded-xl border border-teal-800/40 bg-teal-950/30 p-3.5 text-center">
                    <span className="text-[11px] font-bold uppercase text-teal-300 block">Mild (AE)</span>
                    <p className="text-3xl font-extrabold text-teal-200 mt-1">{aeCount}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Self-Resolving</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Algorithmic WHO-UMC Causality Score: 6/10</span>
                  <span className="text-emerald-400 font-semibold">Zero Protocol Violations</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  </section>
)}

{reportPatientId && (() => {
  const patient = participants.find((p) => p.id === reportPatientId);
  const trial = patient ? trials.find((t) => t.trialId === patient.trialId) : undefined;
  if (!patient || !trial) return null;
  const patientEvents = safetyEventsState.filter((e) => e.trialId === trial.trialId && e.participantId === patient.id);
  const fields: Array<[string, string | number]> = [
    ["Patient ID", patient.id], ["Age", patient.age], ["Sex", patient.sex],
    ["Enrollment Date", patient.enrollmentDate], ["Site", patient.site],
    ["Consent", patient.consent], ["Treatment Arm", patient.treatmentArm],
    ["Baseline Condition", patient.baselineCondition], ["Presenting Complaint", patient.presentingComplaint],
    ["Diagnosis", patient.diagnosis], ["Disease Duration", patient.diseaseDuration],
    ["Current Symptoms", patient.currentSymptoms], ["Prior Treatment", patient.priorTreatment],
    ["Family History", patient.familyHistory], ["Lifestyle Factors", patient.lifestyleFactors],
    ["Prakriti", patient.prakriti], ["Dosha Assessment", patient.doshaAssessment],
    ["Medical History", patient.medicalHistory], ["Allergies", patient.allergies],
    ["Concomitant Medication", patient.concomitantMedication], ["Baseline Vitals", patient.baselineVitals],
    ["Lab Summary", patient.labSummary], ["Inclusion Criteria", patient.inclusionCriteria],
    ["Exclusion Criteria", patient.exclusionCriteria], ["Visit Schedule", patient.visitSchedule],
    ["Adherence", patient.adherence], ["Follow-up Status", patient.followUpStatus],
    ["Outcome Notes", patient.outcomeNotes], ["Notes", patient.notes]
  ];
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-indigo-800/60 bg-slate-950 shadow-2xl flex flex-col">
        {/* Modal Top Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800 px-6 py-5 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-teal-300 font-bold">AIIA Clinical Subject Dossier</span>
              <span className="rounded-full bg-teal-950/80 border border-teal-700/50 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
                CDISC SDTM Verified
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-50 flex flex-wrap items-center gap-2.5">
              <span className="font-mono">{patient.id}</span>
              <span className="text-xs font-bold text-indigo-200 rounded-md bg-indigo-950/80 border border-indigo-700/50 px-2.5 py-1">
                Age: {patient.age} yrs • {patient.sex}
              </span>
              {patient.abhaId && (
                <span className="text-xs font-normal font-mono text-emerald-300 rounded-md bg-emerald-950/60 border border-emerald-700/40 px-2 py-0.5">
                  ABHA: {patient.abhaId}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{trial.studyName} • {trial.systemOfMedicine} • {trial.studyFocus}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => downloadPatientReport(patient.id, trial.trialId)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md">
              <Download size={15}/> Full Report (PDF)
            </button>
            <button type="button" onClick={() => downloadPatientHealthHistory(patient.id, trial.trialId)} className="inline-flex items-center gap-2 rounded-lg border border-teal-700/60 bg-teal-950/40 px-4 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-900/60 shadow-sm">
              <Download size={15}/> Health History (PDF)
            </button>
            <button type="button" onClick={() => setReportPatientId("")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"><X size={22}/></button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quick Metrics Banner: Vitals + Organ Labs + Prakriti */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Vital Signs */}
            <div className="rounded-xl border border-teal-800/40 bg-teal-950/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Baseline Vitals</span>
                <span className="text-[10px] text-teal-400/80 font-mono">SDTM VS Domain</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Blood Pressure</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.vitalSigns ? `${patient.vitalSigns.sysbp}/${patient.vitalSigns.diabp}` : "128/82"} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Pulse Rate</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.vitalSigns ? `${patient.vitalSigns.pulse}` : "74"} <span className="text-[10px] font-normal text-slate-400">bpm</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Body Temp</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.vitalSigns ? `${patient.vitalSigns.temp}` : "98.4"} <span className="text-[10px] font-normal text-slate-400">°F</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Body Mass Index</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.vitalSigns ? `${patient.vitalSigns.bmi}` : "24.2"} <span className="text-[10px] font-normal text-slate-400">kg/m²</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Organ Safety Labs */}
            <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Safety Labs (LFT / KFT)</span>
                <span className="text-[10px] text-indigo-400/80 font-mono">SDTM LB Domain</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">SGOT (AST)</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.safetyLabMetrics ? `${patient.safetyLabMetrics.sgot}` : "28"} <span className="text-[10px] font-normal text-slate-400">U/L</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">SGPT (ALT)</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.safetyLabMetrics ? `${patient.safetyLabMetrics.sgpt}` : "31"} <span className="text-[10px] font-normal text-slate-400">U/L</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Serum Creatinine</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.safetyLabMetrics ? `${patient.safetyLabMetrics.creatinine}` : "0.9"} <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                  <p className="text-slate-400 text-[10px]">Glycated HbA1c</p>
                  <p className="text-slate-100 font-bold text-sm mt-0.5">
                    {patient.safetyLabMetrics ? `${patient.safetyLabMetrics.hba1c}` : "5.6"} <span className="text-[10px] font-normal text-slate-400">%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Ayurveda Phenotype & Dosha Score */}
            <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Prakriti Phenotype</span>
                <span className="rounded-full bg-purple-900/50 border border-purple-600/40 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                  {patient.prakriti || "Vata-Pitta"}
                </span>
              </div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Vata Dosha</span>
                    <span className="font-bold text-purple-300">{patient.doshaScore?.vata ?? 54}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${patient.doshaScore?.vata ?? 54}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Pitta Dosha</span>
                    <span className="font-bold text-amber-300">{patient.doshaScore?.pitta ?? 32}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${patient.doshaScore?.pitta ?? 32}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Kapha Dosha</span>
                    <span className="font-bold text-emerald-300">{patient.doshaScore?.kapha ?? 14}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${patient.doshaScore?.kapha ?? 14}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Clinical Fields Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Complete Clinical Variables & Trial Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200 break-words">{String(value || "Not recorded")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Adverse Events */}
          <div className="rounded-xl border border-red-900/50 bg-red-950/15 overflow-hidden">
            <div className="border-b border-red-900/40 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-red-300">Pharmacovigilance & Adverse Event Surveillance</h3>
              <span className="text-xs text-red-400/80 font-mono">NPvCC Safety Feed</span>
            </div>
            {patientEvents.length ? patientEvents.map((e) => (
              <div key={e.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 border-b border-slate-800 last:border-0 p-4">
                <div><p className="text-xs text-slate-500">Event</p><p className="text-sm text-slate-200 mt-1 font-semibold">{e.event}</p></div>
                <div><p className="text-xs text-slate-500">Type</p><p className="text-sm text-slate-200 mt-1 font-mono">{e.type}</p></div>
                <div><p className="text-xs text-slate-500">Severity</p><p className="text-sm text-slate-200 mt-1">{e.severity}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><p className="text-sm text-slate-200 mt-1">{e.status}</p></div>
                <div><p className="text-xs text-slate-500">Action Taken</p><p className="text-sm text-slate-200 mt-1">{e.actionTaken || "Not recorded"}</p></div>
              </div>
            )) : <p className="p-5 text-sm text-slate-500">No safety events recorded for this subject.</p>}
          </div>
        </div>
      </div>
    </div>
  );
})()}

{showAddParticipant && (
  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[92vh] overflow-y-auto custom-scrollbar border border-indigo-700/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-950/80 border border-teal-700/50 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
              CDISC SDTM & ABDM Enrolment
            </span>
            <span className="text-xs text-slate-400">GCP-ASU & DPDP Act 2023 Compliant</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-50 mt-1">Enrol Subject into Protocol</h2>
          <p className="text-xs text-slate-400 mt-0.5">Enter verified clinical trial screening and baseline parameters for the new subject.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddParticipant(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="rounded-xl bg-indigo-950/40 border border-indigo-700/40 p-4 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Target Study Protocol</span>
        <p className="font-bold text-white text-base mt-0.5">
          {selectedParticipantTrial?.trialId} — {selectedParticipantTrial?.studyName}
        </p>
        <p className="text-xs text-indigo-300 mt-1">
          Current Enrolment: <span className="font-bold text-white">{selectedParticipantTrial?.enrolled}</span> / {selectedParticipantTrial?.targetPatients} subjects → Projected after submit: <span className="font-bold text-teal-300">{(selectedParticipantTrial?.enrolled ?? 0) + 1}</span> / {selectedParticipantTrial?.targetPatients}
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Demographics & ABDM Identity */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <span>1. Subject Demographics & Ayushman Bharat (ABDM) Identity</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Unique Subject ID (USUBJID) *</label>
              <input
                type="text"
                value={newParticipant.id}
                onChange={(e) => setNewParticipant({ ...newParticipant, id: e.target.value })}
                className="field font-mono font-bold text-teal-300"
              />
            </div>
            <div>
              <label className="label">Age (Years) *</label>
              <input
                type="number"
                min="1"
                max="120"
                placeholder="e.g. 56"
                value={newParticipant.age}
                onChange={(e) => setNewParticipant({ ...newParticipant, age: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Biological Sex *</label>
              <select
                value={newParticipant.sex}
                onChange={(e) => setNewParticipant({ ...newParticipant, sex: e.target.value })}
                className="field"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Study Site *</label>
              <input
                type="text"
                value={newParticipant.site}
                onChange={(e) => setNewParticipant({ ...newParticipant, site: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label">ABDM ABHA ID Number</label>
              <input
                type="text"
                placeholder="e.g. 91-4821-3941-8012"
                value={newParticipant.outcomeNotes?.includes("ABHA ID: ") ? newParticipant.outcomeNotes.split("ABHA ID: ")[1].split(" •")[0] : "91-4821-3941-8012"}
                onChange={(e) => setNewParticipant({
                  ...newParticipant,
                  outcomeNotes: `ABHA ID: ${e.target.value} • e-Consent Verified`
                })}
                className="field font-mono"
              />
            </div>
            <div>
              <label className="label">Randomization / Enrolment Date *</label>
              <input
                type="date"
                value={newParticipant.enrollmentDate}
                onChange={(e) => setNewParticipant({ ...newParticipant, enrollmentDate: e.target.value })}
                className="field"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Informed Consent & Ethics Audit */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            2. GCP-ASU Informed Consent & Ethics Verification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Informed Consent Status *</label>
              <select
                value={newParticipant.consent}
                onChange={(e) => setNewParticipant({ ...newParticipant, consent: e.target.value })}
                className="field"
              >
                <option value="Obtained">Obtained (Verified Signed)</option>
                <option value="Pending">Pending Re-consent</option>
              </select>
            </div>
            <div>
              <label className="label">Informed Consent Modality</label>
              <select className="field">
                <option>Electronic Audio-Visual (AV) Consent</option>
                <option>Written Digital e-Form</option>
                <option>Bilingual Digital Signature</option>
              </select>
            </div>
            <div>
              <label className="label">Consent Language</label>
              <select className="field">
                <option>Hindi</option>
                <option>English</option>
                <option>Sanskrit</option>
                <option>Tamil</option>
                <option>Bengali</option>
              </select>
            </div>
            <div>
              <label className="label">Protocol Inclusion Criteria</label>
              <select
                value={newParticipant.inclusionCriteria}
                onChange={(e) => setNewParticipant({ ...newParticipant, inclusionCriteria: e.target.value })}
                className="field"
              >
                <option value="Met">Met (All Criteria Confirmed)</option>
                <option value="Pending Verification">Pending Lab Verification</option>
              </select>
            </div>
            <div>
              <label className="label">Exclusion Criteria</label>
              <select
                value={newParticipant.exclusionCriteria}
                onChange={(e) => setNewParticipant({ ...newParticipant, exclusionCriteria: e.target.value })}
                className="field"
              >
                <option value="None">None (Acceptable for Enrolment)</option>
                <option value="Present">Present (Disqualifying)</option>
              </select>
            </div>
            <div>
              <label className="label">DPDP Act 2023 Notice</label>
              <input type="text" readOnly value="Notice Given & Data Minimization Agreed" className="field text-xs text-slate-400" />
            </div>
          </div>
        </div>

        {/* Section 3: Ayurveda Phenotyping & Prakriti */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            3. Ayurveda Clinical Phenotyping (Prakriti & Agni Assessment)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Prakriti (Constitutional Type) *</label>
              <select
                value={newParticipant.prakriti}
                onChange={(e) => setNewParticipant({ ...newParticipant, prakriti: e.target.value })}
                className="field font-semibold text-amber-300"
              >
                <option value="Vata-Pitta">Vata-Pitta</option>
                <option value="Pitta-Kapha">Pitta-Kapha</option>
                <option value="Vata-Kapha">Vata-Kapha</option>
                <option value="Pitta-Vata">Pitta-Vata</option>
                <option value="Kapha-Vata">Kapha-Vata</option>
                <option value="Kapha-Pitta">Kapha-Pitta</option>
              </select>
            </div>
            <div>
              <label className="label">Dosha Breakdown (%)</label>
              <input
                type="text"
                value={newParticipant.doshaAssessment}
                onChange={(e) => setNewParticipant({ ...newParticipant, doshaAssessment: e.target.value })}
                className="field"
                placeholder="e.g. Vata: 44%, Pitta: 36%, Kapha: 20%"
              />
            </div>
            <div>
              <label className="label">Digestive Fire (Agni) & Kostha</label>
              <input
                type="text"
                value={newParticipant.lifestyleFactors}
                onChange={(e) => setNewParticipant({ ...newParticipant, lifestyleFactors: e.target.value })}
                className="field"
                placeholder="Agni: Sama; Kostha: Madhyama"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Baseline Vitals & Organ Safety Labs */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            4. Baseline Vitals & Organ Safety Biomarkers (CDISC VS & LB Domains)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Baseline Vital Signs (BP, Pulse, Temp, BMI)</label>
              <input
                type="text"
                value={newParticipant.baselineVitals}
                onChange={(e) => setNewParticipant({ ...newParticipant, baselineVitals: e.target.value })}
                className="field"
                placeholder="BP 124/80 mmHg; Pulse 72 bpm; Temp 98.4°F; BMI 23.8 kg/m²"
              />
            </div>
            <div>
              <label className="label">Safety Labs (FBS, SGOT, SGPT, Creatinine, Bilirubin)</label>
              <input
                type="text"
                value={newParticipant.labSummary}
                onChange={(e) => setNewParticipant({ ...newParticipant, labSummary: e.target.value })}
                className="field"
                placeholder="FBS 94 mg/dL; HbA1c 5.5%; SGOT 22 U/L; SGPT 24 U/L; Creatinine 0.86 mg/dL"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Protocol Allocation & Clinical Diagnosis */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
            5. Clinical Diagnosis & Treatment Allocation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Randomized Treatment Arm *</label>
              <input
                type="text"
                value={newParticipant.treatmentArm}
                onChange={(e) => setNewParticipant({ ...newParticipant, treatmentArm: e.target.value })}
                className="field"
                placeholder="e.g. Ashwagandha 300mg BID / Matching Placebo"
              />
            </div>
            <div>
              <label className="label">Primary Clinical Diagnosis *</label>
              <input
                type="text"
                value={newParticipant.diagnosis}
                onChange={(e) => setNewParticipant({ ...newParticipant, diagnosis: e.target.value })}
                className="field"
                placeholder="e.g. Mild Cognitive Impairment (Smriti Bhramsha)"
              />
            </div>
            <div>
              <label className="label">Presenting Complaints</label>
              <input
                type="text"
                value={newParticipant.presentingComplaint}
                onChange={(e) => setNewParticipant({ ...newParticipant, presentingComplaint: e.target.value })}
                className="field"
                placeholder="e.g. Recent memory lapses, mental fatigue"
              />
            </div>
            <div>
              <label className="label">Disease Duration</label>
              <input
                type="text"
                value={newParticipant.diseaseDuration}
                onChange={(e) => setNewParticipant({ ...newParticipant, diseaseDuration: e.target.value })}
                className="field"
                placeholder="e.g. 14 months"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setShowAddParticipant(false)}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 font-semibold text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAddParticipant}
          className="flex-1 rounded-xl bg-indigo-600 text-white px-4 py-3 font-semibold hover:bg-indigo-500 shadow-lg"
        >
          Submit & Enrol Subject
        </button>
      </div>
    </div>
  </div>
)}

{showAddSafety && (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl p-6"><div className="flex justify-between"><div><h2 className="text-2xl font-bold">Record Safety Event</h2><p className="text-sm text-slate-400 mt-1">Capture AE / ADR / SAE for pharmacovigilance review.</p></div><button onClick={()=>setShowAddSafety(false)}><X/></button></div><div className="grid md:grid-cols-2 gap-4 mt-6"><div><label className="label">Study *</label><select value={newSafety.trialId} onChange={e=>setNewSafety({...newSafety,trialId:e.target.value,participantId:""})} className="field"><option value="">Select medicine / study</option>{trials.map(t=><option key={t.trialId} value={t.trialId}>{t.trialId} — {t.studyName}</option>)}</select></div><div><label className="label">Patient ID *</label><select value={newSafety.participantId} onChange={e=>setNewSafety({...newSafety,participantId:e.target.value})} className="field" disabled={!newSafety.trialId}><option value="">Select patient</option>{participants.filter(p=>p.trialId===newSafety.trialId).map(p=><option key={p.id} value={p.id}>{p.id}</option>)}</select></div><div><label className="label">Type *</label><select value={newSafety.type} onChange={e=>setNewSafety({...newSafety,type:e.target.value})} className="field"><option>AE</option><option>ADR</option><option>SAE</option></select></div><div><label className="label">Suspected Medicine / Intervention</label><input value={newSafety.suspectedMedicine} onChange={e=>setNewSafety({...newSafety,suspectedMedicine:e.target.value})} className="field" placeholder="Medicine / intervention involved"/></div><div><label className="label">Severity *</label><select value={newSafety.severity} onChange={e=>setNewSafety({...newSafety,severity:e.target.value})} className="field"><option>Mild</option><option>Moderate</option><option>Severe</option><option>Life-threatening</option></select></div><div className="md:col-span-2"><label className="label">Event description *</label><input value={newSafety.event} onChange={e=>setNewSafety({...newSafety,event:e.target.value})} className="field" placeholder="Describe adverse event"/></div><div><label className="label">Onset Date *</label><input type="date" value={newSafety.onsetDate} onChange={e=>setNewSafety({...newSafety,onsetDate:e.target.value})} className="field"/></div><div><label className="label">Causality</label><select value={newSafety.causality} onChange={e=>setNewSafety({...newSafety,causality:e.target.value})} className="field"><option>Not assessed</option><option>Unlikely</option><option>Possible</option><option>Probable</option><option>Certain</option></select></div><div><label className="label">Outcome</label><select value={newSafety.outcome} onChange={e=>setNewSafety({...newSafety,outcome:e.target.value})} className="field"><option>Ongoing</option><option>Recovered</option><option>Recovering</option><option>Fatal</option><option>Unknown</option></select></div><div><label className="label">Action Taken</label><input value={newSafety.actionTaken} onChange={e=>setNewSafety({...newSafety,actionTaken:e.target.value})} className="field" placeholder="Treatment / dose change / referral"/></div><div><label className="label">Seriousness Criteria</label><input value={newSafety.seriousnessCriteria} onChange={e=>setNewSafety({...newSafety,seriousnessCriteria:e.target.value})} className="field" placeholder="Hospitalization / disability / life-threatening etc."/></div><div><label className="label">Status</label><select value={newSafety.status} onChange={e=>setNewSafety({...newSafety,status:e.target.value})} className="field"><option>Open</option><option>Under Review</option><option>Escalated</option><option>Closed</option></select></div></div><div className="flex gap-3 mt-6"><button onClick={()=>setShowAddSafety(false)} className="flex-1 border rounded-lg py-3 font-semibold">Cancel</button><button onClick={handleAddSafety} className="flex-1 bg-indigo-600 text-white rounded-lg py-3 font-semibold">Submit Safety Event</button></div></div></div>
)}

{showAddCompliance && (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl p-6"><div className="flex justify-between"><div><h2 className="text-2xl font-bold">Add Compliance Requirement</h2><p className="text-sm text-slate-400 mt-1">Track IEC, CTRI, monitoring and close-out deadlines.</p></div><button onClick={()=>setShowAddCompliance(false)}><X/></button></div><div className="space-y-4 mt-6"><div><label className="label">Trial *</label><select value={newCompliance.trialId} onChange={e=>setNewCompliance({...newCompliance,trialId:e.target.value})} className="field"><option value="">Select trial</option>{trials.map(t=><option key={t.trialId} value={t.trialId}>{t.trialId} — {t.studyName}</option>)}</select></div><div><label className="label">Compliance Item *</label><input value={newCompliance.item} onChange={e=>setNewCompliance({...newCompliance,item:e.target.value})} className="field" placeholder="IEC approval / CTRI update / Monitoring visit"/></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Due Date *</label><input type="date" value={newCompliance.dueDate} onChange={e=>setNewCompliance({...newCompliance,dueDate:e.target.value})} className="field"/></div><div><label className="label">Status</label><select value={newCompliance.status} onChange={e=>setNewCompliance({...newCompliance,status:e.target.value})} className="field"><option>Upcoming</option><option>Pending</option><option>Overdue</option><option>Completed</option></select></div></div></div><div className="flex gap-3 mt-6"><button onClick={()=>setShowAddCompliance(false)} className="flex-1 border rounded-lg py-3 font-semibold">Cancel</button><button onClick={handleAddCompliance} className="flex-1 bg-indigo-600 text-white rounded-lg py-3 font-semibold">Submit Compliance</button></div></div></div>
)}

{showAddAction && (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl p-6"><div className="flex justify-between"><div><h2 className="text-2xl font-bold">Create Action</h2><p className="text-sm text-slate-400 mt-1">Assign an accountable owner and due date.</p></div><button onClick={()=>setShowAddAction(false)}><X/></button></div><div className="space-y-4 mt-6"><div><label className="label">Trial *</label><select value={newAction.trialId} onChange={e=>setNewAction({...newAction,trialId:e.target.value})} className="field"><option value="">Select trial</option>{trials.map(t=><option key={t.trialId} value={t.trialId}>{t.trialId} — {t.studyName}</option>)}</select></div><div><label className="label">Action *</label><textarea value={newAction.action} onChange={e=>setNewAction({...newAction,action:e.target.value})} className="field min-h-24" placeholder="Describe required action"/></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Owner *</label><input value={newAction.owner} onChange={e=>setNewAction({...newAction,owner:e.target.value})} className="field"/></div><div><label className="label">Due Date *</label><input type="date" value={newAction.dueDate} onChange={e=>setNewAction({...newAction,dueDate:e.target.value})} className="field"/></div><div><label className="label">Priority</label><select value={newAction.priority} onChange={e=>setNewAction({...newAction,priority:e.target.value})} className="field"><option>High</option><option>Medium</option><option>Low</option></select></div><div><label className="label">Status</label><select value={newAction.status} onChange={e=>setNewAction({...newAction,status:e.target.value})} className="field"><option>Open</option><option>In Progress</option><option>Completed</option></select></div></div></div><div className="flex gap-3 mt-6"><button onClick={()=>setShowAddAction(false)} className="flex-1 border rounded-lg py-3 font-semibold">Cancel</button><button onClick={handleAddAction} className="flex-1 bg-indigo-600 text-white rounded-lg py-3 font-semibold">Create Action</button></div></div></div>
)}

{showAddTrial && (
  <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
    <div className="flex h-[88vh] w-[min(92vw,720px)] max-w-[720px] flex-col overflow-hidden rounded-2xl border border-indigo-700/40 bg-slate-900 shadow-2xl ring-1 ring-white/5">

      {/* Header stays fixed; form scrolls independently */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5 sm:px-7">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold leading-tight text-slate-50">
            Add New Clinical Trial
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter registry, intervention and recruitment details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddTrial(false)}
          className="ml-4 shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
          aria-label="Close Add New Clinical Trial"
        >
          <X size={22} />
        </button>
      </div>

      {/* Independent scrolling form area — no label/text can overlap another */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Trial ID / CTRI Protocol Number *
            </label>
            <input
              type="text"
              placeholder="e.g. CTRI/2026/03/062145 or AIIA-CT-2026-08"
              value={newTrial.trialId}
              onChange={(e) => setNewTrial({ ...newTrial, trialId: e.target.value })}
              className="w-full border border-slate-700 bg-slate-800/80 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">Prospective Clinical Trials Registry – India (CTRI) or institutional protocol code.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Official Clinical Study Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Double-blind Randomized Controlled Study of Standardized Ashwagandha in Mild Cognitive Impairment"
              value={newTrial.studyName}
              onChange={(e) => setNewTrial({ ...newTrial, studyName: e.target.value })}
              className="w-full border border-slate-700 bg-slate-800/80 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">
                Lead Principal Investigator *
              </label>
              <input
                type="text"
                placeholder="Prof. (Dr.) Tanuja Nesari, MD (Ayu)"
                value={newTrial.investigator}
                onChange={(e) => setNewTrial({ ...newTrial, investigator: e.target.value })}
                className="w-full border border-slate-700 bg-slate-800/80 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">
                Sponsor / Lead Institution
              </label>
              <input
                type="text"
                placeholder="All India Institute of Ayurveda (AIIA) / Ministry of Ayush"
                value={newTrial.sponsor}
                onChange={(e) => setNewTrial({ ...newTrial, sponsor: e.target.value })}
                className="w-full border border-slate-700 bg-slate-800/80 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">Study Classification & System of Medicine</p>
                <p className="text-xs text-slate-400 mt-0.5">AYUSH domain, study design type, and clinical phase.</p>
              </div>
              <FlaskConical size={18} className="text-teal-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">System of Medicine *</label>
                <select
                  value={newTrial.systemOfMedicine}
                  onChange={(e) => {
                    const medicine = e.target.value;
                    const focus = (STUDY_FOCUS_BY_MEDICINE[medicine] || [DEFAULT_FOCUS])[0];
                    const method = (STUDY_METHODS_BY_FOCUS[focus] || [DEFAULT_METHOD])[0];
                    setNewTrial({
                      ...newTrial,
                      systemOfMedicine: medicine,
                      studyFocus: focus,
                      studyMethod: method
                    });
                  }}
                  className="w-full border border-slate-700 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {MEDICINE_OPTIONS.map((medicine) => (
                    <option key={medicine}>{medicine}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Study Type *</label>
                <select
                  value={newTrial.studyType}
                  onChange={(e) => setNewTrial({
                    ...newTrial,
                    studyType: e.target.value
                  })}
                  className="w-full border border-slate-700 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option>Interventional</option>
                  <option>Observational</option>
                  <option>Expanded Access</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Phase (Auto-Assigned)</label>
                <div className="w-full border border-emerald-500/40 bg-emerald-950/30 rounded-lg px-3 py-2 text-xs text-emerald-300 flex items-center justify-between font-medium">
                  <span>Phase I (Safety & Tolerability)</span>
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">Auto-Computed</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Advances automatically based on cohort enrollment & dossier progress.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Study Focus *</label>
                <select
                  value={newTrial.studyFocus}
                  onChange={(e) => {
                    const focus = e.target.value;
                    setNewTrial({
                      ...newTrial,
                      studyFocus: focus,
                      studyMethod: (STUDY_METHODS_BY_FOCUS[focus] || [DEFAULT_METHOD])[0]
                    });
                  }}
                  className="w-full border border-slate-700 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {(STUDY_FOCUS_BY_MEDICINE[newTrial.systemOfMedicine] || [DEFAULT_FOCUS]).map((focus) => (
                    <option key={focus}>{focus}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Study Method / Trial Design *</label>
                <select
                  value={newTrial.studyMethod}
                  onChange={(e) => setNewTrial({ ...newTrial, studyMethod: e.target.value })}
                  className="w-full border border-slate-700 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {(STUDY_METHODS_BY_FOCUS[newTrial.studyFocus] || [DEFAULT_METHOD]).map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1">
              Botanical Formulation / Active Intervention *
            </label>
            <input
              type="text"
              placeholder="e.g. Standardized Withania somnifera Root Extract (500mg BD, 5% withanolides HPLC certified)"
              value={newTrial.intervention}
              onChange={(e) => setNewTrial({ ...newTrial, intervention: e.target.value })}
              className="w-full border border-slate-700 bg-slate-800/80 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">Specify botanical ingredients, dosage form, batch standardization, and pharmacopoeial marker reference.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">
                Target Sample Size (Planned Participants) *
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                min="1"
                value={newTrial.targetPatients}
                onChange={(e) => setNewTrial({ ...newTrial, targetPatients: e.target.value })}
                className="w-full border border-slate-700 bg-slate-800/80 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-400">Statistically powered sample size approved by Institutional Ethics Committee.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">
                Recruitment Status *
              </label>
              <select
                value={newTrial.recruitmentStatus}
                onChange={(e) => setNewTrial({ ...newTrial, recruitmentStatus: e.target.value })}
                className="w-full border border-slate-700 bg-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100"
              >
                <option>Recruiting</option>
                <option>Not Yet Recruiting</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Suspended</option>
                <option>Terminated</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">Current regulatory recruitment phase.</p>
            </div>
          </div>

          {/* Enrolled box removed and replaced by regulatory compliance info */}
          <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-teal-300">CDISC SDTM & GCP Regulatory Standard</h4>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Per Good Clinical Practice (GCP-ASU) and CDISC SDTM Subject Enrollment rules, newly registered studies initialize with <strong>0 enrolled subjects</strong>.
                  Participants must be enrolled prospectively with formal informed consent via the <strong>Recruitment & Participants</strong> trial-wise enrollment portal.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer is outside the scroll area, so buttons never cover a field */}
      <div className="flex shrink-0 gap-3 border-t border-slate-800 bg-slate-900 px-6 py-4 sm:px-7">
        <button
          type="button"
          onClick={() => setShowAddTrial(false)}
          className="flex-1 border rounded-lg px-4 py-3 font-semibold"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleAddTrial}
          className="flex-1 bg-indigo-700 text-white rounded-lg px-4 py-3 font-semibold hover:bg-indigo-600"
        >
          Add Trial
        </button>
      </div>

    </div>
  </div>
)}

      </main>
    </div>
  );
}

export default App;