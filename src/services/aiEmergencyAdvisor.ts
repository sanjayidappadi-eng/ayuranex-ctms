/**
 * AyuraNex Clinical AI Emergency Action Protocol Engine
 * Grounded in:
 * - New Drugs and Clinical Trials Rules, 2019 (Schedule G / Rule 42)
 * - Good Clinical Practice for ASU Drugs (GCP-ASU) & WHO-UMC Guidelines
 * - 21 CFR Part 312.32 (IND Safety Reporting)
 */

export interface AiEmergencyProtocol {
  urgencyLevel: "CRITICAL_IMMEDIATE" | "HIGH_PRIORITY" | "MODERATE_OBSERVATION";
  immediateBedsideActions: string[];
  statutoryNextSteps: {
    timeframe: string;
    action: string;
    authority: string;
    formRef: string;
  }[];
  cohortSafeguard: string;
  smsActionSnippet: string;
  aiRationale: string;
  timestamp: string;
}

/**
 * Evaluates clinical event particulars and generates immediate emergency action protocols
 */
export function generateAiEmergencyProtocol(params: {
  patientId: string;
  trialId: string;
  trialName?: string;
  meddraPt: string;
  severity: string;
  suspectedDrug?: string;
  causalityScore?: number;
}): AiEmergencyProtocol {
  const {
    patientId,
    trialId,
    trialName = "Ayurvedic Clinical Protocol",
    meddraPt,
    severity,
    suspectedDrug = "Investigational Product",
    causalityScore = 6
  } = params;

  const isSevere = severity.toLowerCase().includes("severe") || severity.toLowerCase().includes("life") || severity.toLowerCase().includes("sae");
  const isHepatic = /hepat|transaminase|alt|ast|liver|jaundice/i.test(meddraPt);
  const isRenal = /renal|creatinine|kidney|nephro/i.test(meddraPt);
  const isAllergic = /anaphylax|angioedema|rash|broncho|hypersens/i.test(meddraPt);
  const isCardio = /arrhythm|tachycard|hypotens|infarct|ischemi/i.test(meddraPt);

  // 1. Determine Immediate Bedside Actions
  const immediateBedsideActions: string[] = [];
  immediateBedsideActions.push(`Permanently withhold investigational product (${suspectedDrug}) for subject ${patientId}. Retain current batch for analytical audit.`);

  if (isHepatic) {
    immediateBedsideActions.push("Stat Serum LFT Panel (ALT, AST, ALP, Total and Direct Bilirubin, INR) at 0h, 12h, 24h.");
    immediateBedsideActions.push("Initiate IV supportive hydration and hepatoprotective protocol (e.g. N-acetylcysteine infusion if ALT elevated over 5x ULN).");
    immediateBedsideActions.push("Consult Senior Gastroenterologist / Hepatologist for clinical staging.");
  } else if (isRenal) {
    immediateBedsideActions.push("Stat Renal Function Test (Serum Creatinine, BUN, eGFR, Spot Urine Protein:Creatinine).");
    immediateBedsideActions.push("Maintain strict fluid balance intake/output chart; avoid nephrotoxic concomitant drugs.");
  } else if (isAllergic) {
    immediateBedsideActions.push("Maintain patent airway; administer IV Hydrocortisone 100mg stat & intramuscular Epinephrine (1:1000) if hemodynamic compromise.");
    immediateBedsideActions.push("Continuous vital sign telemetry (SpO2, NIBP, continuous ECG).");
  } else if (isCardio) {
    immediateBedsideActions.push("Stat 12-lead ECG and continuous cardiac telemetry monitoring.");
    immediateBedsideActions.push("Stat cardiac biomarkers: Troponin-I / High-Sensitivity Troponin and CK-MB.");
  } else {
    immediateBedsideActions.push("Stat clinical toxicology workup and organ function assessment corresponding to MedDRA PT: " + meddraPt);
    immediateBedsideActions.push("Establish 18G IV access and institute hemodynamic monitoring.");
  }

  immediateBedsideActions.push("Quarantine investigational batch kit and retain sample for AYUSH Pharmacopoeia Laboratory re-assay.");

  // 2. Determine Statutory Regulatory Next Steps (NDCT Rules 2019)
  const statutoryNextSteps = [
    {
      timeframe: "0 - 24 Hours",
      action: "Mandatory Rule 42 Preliminary Expedited SAE Notification to CDSCO (SUGAM portal) and Institutional Ethics Committee (IEC).",
      authority: "DCGI & AIIA IEC",
      formRef: "Form CT-SAE-1"
    },
    {
      timeframe: "24 - 48 Hours",
      action: "Convene Emergency Ad-Hoc Data and Safety Monitoring Board (DSMB) safety review to determine cohort stopping rules.",
      authority: "AIIA DSMB Panel",
      formRef: "DSMB-EMERG-REV"
    },
    {
      timeframe: "1 - 14 Days",
      action: "Submit Comprehensive Detailed Medical Follow-up Report with complete causality attribution and patient outcome.",
      authority: "Licensing Authority (CDSCO)",
      formRef: "Form CT-20 / Table 1"
    }
  ];

  // 3. Cohort Safeguards
  const cohortSafeguard = isSevere
    ? `PAUSE further enrollment in study ${trialId} until DSMB safety concurrence. Perform safety check on all active cohort subjects.`
    : `Maintain enhanced active safety surveillance for all active participants on protocol ${trialId}.`;

  // 4. Concise SMS Action Snippet
  const smsActionSnippet = `ACTION REQUIRED: 1) Withhold ${suspectedDrug}. 2) Stat clinical labs. 3) Rule 42 24h DCGI notice filed. Check email for emergency clinical protocol.`;

  // 5. AI Rationale
  const aiRationale = `AI Emergency Protocol triggered for ${severity} event (${meddraPt}) under Study ${trialName} (${trialId}). WHO-UMC Causality Score: ${causalityScore}/10 (Probable). Immediate formulation cessation and 24h statutory regulatory escalation mandated under NDCT Rules 2019 Rule 42.`;

  return {
    urgencyLevel: isSevere ? "CRITICAL_IMMEDIATE" : "HIGH_PRIORITY",
    immediateBedsideActions,
    statutoryNextSteps,
    cohortSafeguard,
    smsActionSnippet,
    aiRationale,
    timestamp: new Date().toISOString()
  };
}
