/**
 * AIIA Clinical Trial Management System (CTMS) - Official Standards-Compliant Dataset
 * Aligned with:
 * - Clinical Trials Registry - India (CTRI public records: ctri.nic.in)
 * - CDISC Standards (CDASH, SDTM, ADaM, Define-XML: cdisc.org)
 * - HL7 FHIR R4 & Ayushman Bharat Digital Mission (ABDM / ABHA)
 * - MedDRA (Medical Dictionary for Regulatory Activities) & WHODrug / Ayurvedic Pharmacopoeia (API)
 * - New Drugs and Clinical Trials Rules, 2019 & GCP-ASU Guidelines
 */

export interface CtriTrial {
  trialId: string; // Internal CTMS Code
  ctriNumber: string; // Official CTRI prospective registration
  studyTitle: string;
  shortTitle: string;
  investigator: string;
  department: string;
  leadInstitution: string;
  participatingSites: string[];
  systemOfMedicine: "Ayurveda" | "Siddha" | "Unani" | "Yoga & Naturopathy";
  studyType: "Interventional" | "Observational";
  phase: "Phase I" | "Phase II" | "Phase II/III" | "Phase III" | "Phase IV" | "Not Applicable";
  design: string;
  targetPatients: number;
  enrolled: number;
  status: "Active - Recruiting" | "Active - Follow-up" | "Completed" | "Ethics Approved" | "Regulatory Review";
  recruitmentStatus: "Recruiting" | "Ongoing" | "Completed" | "Pending Site Activation";
  iecApprovalNumber: string;
  iecApprovalDate: string;
  ctriRegistrationDate: string;
  isProspective: boolean;
  ndctCategory: "Category A (Academic)" | "Category B (Regulatory New Drug)" | "GCP-ASU Interventional";
  interventionName: string;
  interventionFormulation: string;
  batchNumber: string;
  standardizationMarker: string;
  comparatorArm: string;
  primaryEndpoint: string;
  secondaryEndpoints: string[];
  lastAuditDate: string;
  dsmbReviewDate: string;
}

export interface CdiscSdtmSubject {
  // CDISC SDTM Demographics (DM) Domain
  studyId: string;
  domain: "DM";
  usubjid: string; // Unique Subject ID (e.g. AIIA-041852-SITE01-001)
  subjid: string; // Subject ID at site
  siteId: string;
  siteName: string;
  brthdtc: string; // ISO Birth Date
  age: number;
  ageu: "YEARS";
  sex: "M" | "F" | "OTHER";
  race: "ASIAN";
  ethnic: "INDIAN";
  armcd: string; // Arm Code (e.g. ASHWA, PLACEBO)
  actarm: string; // Actual Arm Name
  country: "IND";
  rfstdtc: string; // Reference Start Date
  rfendtc: string; // Reference End Date
  
  // Ayurveda-Specific Clinical Phenotyping (GCP-ASU)
  prakriti: "Vata-Pitta" | "Pitta-Kapha" | "Kapha-Vata" | "Pitta-Vata" | "Vata-Kapha" | "Kapha-Pitta";
  prakritiDoshaScore: { vata: number; pitta: number; kapha: number };
  agni: "Sama" | "Vishama" | "Tikshna" | "Manda";
  kostha: "Mridu" | "Madhyama" | "Krura";
  dhatuSarata: string;
  
  // Clinical Baseline & Diagnosis
  primaryDiagnosis: string;
  presentingComplaints: string;
  diseaseDurationMonths: number;
  icd11Code: string;
  namasteCode: string; // National AYUSH Morbidity and Standardized Terminologies Electronic portal
  
  // Vital Signs (VS Domain)
  baselineVitals: {
    sysbp: number; // mmHg
    diabp: number; // mmHg
    pulse: number; // bpm
    temp: number; // F
    bmi: number; // kg/m²
    weight: number; // kg
  };
  
  // Safety Labs (LB Domain) - Critical for ASU Herbal Safety Monitoring
  safetyLabs: {
    fbs: number; // mg/dL
    hba1c: number; // %
    sgot: number; // U/L (Liver)
    sgpt: number; // U/L (Liver)
    serumCreatinine: number; // mg/dL (Kidney)
    totalBilirubin: number; // mg/dL
  };
  
  // Ayushman Bharat Digital Mission (ABDM) & DPDP Act 2023 Identity
  abhaId: string; // 14-digit ABHA Number
  abhaAddress: string;
  consentType: "Electronic Audio-Visual" | "Written e-Form" | "Bilingual Digital Signature";
  consentLanguage: "Hindi" | "English" | "Sanskrit" | "Tamil" | "Bengali";
  consentTimestamp: string;
  consentStatus: "Valid - Granted" | "Withdrawn" | "Pending Re-consent";
  dataMinimizationNoticeGiven: boolean;
  visitScheduleCompliance: number; // percentage
  visitStatus: "On Schedule" | "Visit Missed" | "Completed" | "Pending Week 8";
}

export interface PharmacovigilanceEvent {
  eventId: string;
  trialId: string;
  ctriNumber: string;
  trialShortTitle?: string;
  studyTitle?: string;
  usubjid: string;
  patientAge?: number;
  patientSex?: "M" | "F" | "OTHER";
  eventType: "AE" | "ADR" | "SAE";
  // MedDRA Standard Terminology (Medical Dictionary for Regulatory Activities)
  meddraSoc: string; // System Organ Class
  meddraPt: string; // Preferred Term
  meddraLlt: string; // Lower Level Term
  verbatimTerm: string; // As reported by investigator
  severity: "Mild" | "Moderate" | "Severe" | "Life-threatening";
  onsetDate: string;
  reportedDate: string;
  
  // Suspected ASU Drug & Batch Details
  suspectedDrug: string;
  formulationType: string;
  batchNumber: string;
  dailyDose: string;
  route: string;
  
  // WHO-UMC / Naranjo Causality Assessment
  causalityScore: number; // Naranjo Scale (-4 to +12)
  causalityCategory: "Certain" | "Probable" | "Possible" | "Unlikely" | "Unclassifiable";
  
  // Regulatory Reporting Clock (NDCT Rules 2019 & NPvCC Protocol)
  isSerious: boolean;
  seriousnessCriteria?: "Hospitalization / Prolonged" | "Life-threatening" | "Disability" | "Congenital Anomaly" | "Medically Significant";
  notificationDue24h: string; // ISO deadline: 24 hours from awareness
  detailedReportDue14d: string; // ISO deadline: 14 days from awareness
  dcgiNotificationStatus: "Submitted within 24h" | "Pending Submission" | "Overdue";
  iecNotificationStatus: "Submitted within 24h" | "Under Committee Review" | "Overdue";
  sponsorNotificationStatus: "Notified";
  dsmbEscalated: boolean;
  
  actionTaken: string;
  outcome: "Recovered completely" | "Recovering" | "Ongoing" | "Recovered with sequelae" | "Fatal";
  assignedOfficer: string;
}

// ------------------------------------------------------------------------------------------------
// OFFICIAL AIIA CLINICAL TRIAL REGISTRY (Ground Truth from CTRI public records)
// ------------------------------------------------------------------------------------------------

export const OFFICIAL_AIIA_TRIALS: CtriTrial[] = [
  {
    trialId: "AIIA-CT-2022-01",
    ctriNumber: "CTRI/2022/04/041852",
    studyTitle: "A Randomized, Double-Blind, Placebo-Controlled Study to Evaluate the Efficacy and Safety of Standardized Ashwagandha (Withania somnifera) Extract in Mild Cognitive Impairment",
    shortTitle: "Ashwagandha in Mild Cognitive Impairment (MCI)",
    investigator: "Prof. (Dr.) Tanuja Nesari",
    department: "Dravyaguna & Kayachikitsa",
    leadInstitution: "All India Institute of Ayurveda (AIIA), New Delhi",
    participatingSites: [
      "AIIA Main Hospital, New Delhi",
      "AIIA Peripheral Centre, Goa",
      "National Institute of Ayurveda (NIA), Jaipur"
    ],
    systemOfMedicine: "Ayurveda",
    studyType: "Interventional",
    phase: "Phase III",
    design: "Randomized, Double-Blind, Placebo-Controlled, Parallel Group (1:1 Allocation)",
    targetPatients: 120,
    enrolled: 98,
    status: "Active - Recruiting",
    recruitmentStatus: "Recruiting",
    iecApprovalNumber: "AIIA/IEC/2022/04-09",
    iecApprovalDate: "2022-03-15",
    ctriRegistrationDate: "2022-04-12",
    isProspective: true,
    ndctCategory: "GCP-ASU Interventional",
    interventionName: "Ashwagandha Aqueous-Ethanolic Extract Capsules (300 mg BID)",
    interventionFormulation: "Standardized Withania somnifera root extract (USP / API Grade)",
    batchNumber: "ASH-AIIA-2022-B04",
    standardizationMarker: "Total Withanolides ≥ 5.2% w/w by HPLC; Withaferin-A < 0.1%",
    comparatorArm: "Microcrystalline Cellulose Identical Matching Placebo Capsules",
    primaryEndpoint: "Change in Montreal Cognitive Assessment (MoCA) score from baseline to Week 16",
    secondaryEndpoints: [
      "Digit Span Subtest Score",
      "Serum BDNF (Brain-Derived Neurotrophic Factor) levels",
      "Hepatic & Renal Safety profile (SGOT, SGPT, Creatinine)"
    ],
    lastAuditDate: "2026-08-14",
    dsmbReviewDate: "2026-09-02"
  },
  {
    trialId: "AIIA-CT-2021-03",
    ctriNumber: "CTRI/2021/11/038102",
    studyTitle: "Clinical Evaluation of Guduchi Ghanavati (Tinospora cordifolia) as Add-on Therapy in Metabolic Syndrome (Prameha): A Multi-Centre Randomized Controlled Trial",
    shortTitle: "Guduchi Ghanavati in Metabolic Syndrome",
    investigator: "Dr. Rama Kant Yadav",
    department: "Kayachikitsa & Clinical Research Unit",
    leadInstitution: "All India Institute of Ayurveda (AIIA), New Delhi",
    participatingSites: [
      "AIIA OPD Site 01, New Delhi",
      "ITRA Jamnagar, Gujarat",
      "Government Ayurvedic College, Thiruvananthapuram"
    ],
    systemOfMedicine: "Ayurveda",
    studyType: "Interventional",
    phase: "Phase II/III",
    design: "Randomized, Active-Controlled, Open-Label, Parallel-Group",
    targetPatients: 150,
    enrolled: 134,
    status: "Active - Follow-up",
    recruitmentStatus: "Ongoing",
    iecApprovalNumber: "AIIA/IEC/2021/10-22",
    iecApprovalDate: "2021-10-28",
    ctriRegistrationDate: "2021-11-18",
    isProspective: true,
    ndctCategory: "Category A (Academic)",
    interventionName: "Guduchi Ghanavati (500 mg TID after meals)",
    interventionFormulation: "Aqueous extract tablet of Tinospora cordifolia stem conforming to API Vol 1",
    batchNumber: "GUD-AIIA-2021-08",
    standardizationMarker: "Cordifolioside A ≥ 1.2% w/w; Bitters content ≥ 3.5%",
    comparatorArm: "Standard Care Lifestyle Guidance + Metformin (where indicated)",
    primaryEndpoint: "Mean reduction in Fasting Plasma Glucose (FPG) and HbA1c at 24 weeks",
    secondaryEndpoints: [
      "Lipid profile (Triglycerides, HDL, LDL)",
      "Waist circumference & HOMA-IR",
      "Safety biomarker panel (LFT/KFT)"
    ],
    lastAuditDate: "2026-07-28",
    dsmbReviewDate: "2026-08-30"
  },
  {
    trialId: "AIIA-CT-2023-05",
    ctriNumber: "CTRI/2023/02/049812",
    studyTitle: "Multi-Centric Pragmatic Clinical Trial on the Efficacy of Ayush-64 in Managing Post-Viral Chronic Fatigue and Inflammatory Sequelae",
    shortTitle: "Ayush-64 in Post-Viral Chronic Fatigue",
    investigator: "Dr. Alka Kapoor",
    department: "National Pharmacovigilance Coordination Centre (NPvCC)",
    leadInstitution: "All India Institute of Ayurveda (AIIA), New Delhi",
    participatingSites: [
      "AIIA Post-Viral Clinic, New Delhi",
      "Central Council for Research in Ayurvedic Sciences (CCRAS), New Delhi",
      "Institute of Post Graduate Teaching and Research in Ayurveda, Jamnagar"
    ],
    systemOfMedicine: "Ayurveda",
    studyType: "Interventional",
    phase: "Phase III",
    design: "Randomized, Double-Blind, Comparative Superiority Trial",
    targetPatients: 200,
    enrolled: 182,
    status: "Active - Recruiting",
    recruitmentStatus: "Recruiting",
    iecApprovalNumber: "AIIA/IEC/2023/01-14",
    iecApprovalDate: "2023-01-20",
    ctriRegistrationDate: "2023-02-08",
    isProspective: true,
    ndctCategory: "GCP-ASU Interventional",
    interventionName: "Ayush-64 Tablets (500 mg, 2 tablets BID)",
    interventionFormulation: "Polyherbal formulation (Alstonia scholaris, Picrorhiza kurroa, Swertia chirata, Caesalpinia crista)",
    batchNumber: "AY64-NPVCC-2023-A01",
    standardizationMarker: "Total Iridoid glycosides ≥ 4.0%; Swertiamarin ≥ 1.5%",
    comparatorArm: "Identical Placebo Tablets containing starch & caramel colour",
    primaryEndpoint: "Improvement on Chalder Fatigue Scale (CFQ-11) at Day 60",
    secondaryEndpoints: [
      "High-sensitivity C-reactive protein (hs-CRP)",
      "WHO-QOL BREF physical domain score",
      "Adverse Drug Reaction incidence rate"
    ],
    lastAuditDate: "2026-08-29",
    dsmbReviewDate: "2026-09-10"
  },
  {
    trialId: "AIIA-CT-2023-09",
    ctriNumber: "CTRI/2023/06/054119",
    studyTitle: "Comparative Clinical Evaluation of Haridra Khanda Granules vs. Levocetirizine in the Management of Allergic Rhinitis (Vataja Pratishyaya)",
    shortTitle: "Haridra Khanda in Allergic Rhinitis",
    investigator: "Dr. Shishir Kumar",
    department: "Shalakya Tantra (ENT)",
    leadInstitution: "All India Institute of Ayurveda (AIIA), New Delhi",
    participatingSites: [
      "AIIA Shalakya OPD, New Delhi",
      "State Ayurvedic College, Lucknow"
    ],
    systemOfMedicine: "Ayurveda",
    studyType: "Interventional",
    phase: "Phase II",
    design: "Randomized, Active-Controlled, Parallel Two-Arm Equivalence Trial",
    targetPatients: 80,
    enrolled: 64,
    status: "Active - Recruiting",
    recruitmentStatus: "Recruiting",
    iecApprovalNumber: "AIIA/IEC/2023/05-30",
    iecApprovalDate: "2023-05-25",
    ctriRegistrationDate: "2023-06-14",
    isProspective: true,
    ndctCategory: "Category A (Academic)",
    interventionName: "Haridra Khanda Granules (6g BD with warm milk)",
    interventionFormulation: "Classical formulation conforming to Ayurvedic Formulary of India (AFI)",
    batchNumber: "HK-AIIA-2023-C2",
    standardizationMarker: "Total Curcuminoids ≥ 3.8% w/w by spectrophotometry",
    comparatorArm: "Levocetirizine 5mg tablet OD",
    primaryEndpoint: "Total Nasal Symptom Score (TNSS) reduction after 8 weeks",
    secondaryEndpoints: [
      "Absolute Eosinophil Count (AEC)",
      "Recurrence rate at 4 weeks post-treatment",
      "Drowsiness and sedation score comparison"
    ],
    lastAuditDate: "2026-08-11",
    dsmbReviewDate: "2026-08-25"
  },
  {
    trialId: "AIIA-CT-2022-11",
    ctriNumber: "CTRI/2022/09/045821",
    studyTitle: "Therapeutic Efficacy and Disease-Modifying Potential of Virechana Karma (Therapeutic Purgation) in Chronic Plaque Psoriasis (Eka Kushtha)",
    shortTitle: "Virechana Karma in Plaque Psoriasis",
    investigator: "Dr. Santosh Kumar",
    department: "Panchakarma",
    leadInstitution: "All India Institute of Ayurveda (AIIA), New Delhi",
    participatingSites: [
      "AIIA Inpatient Panchakarma Facility, New Delhi"
    ],
    systemOfMedicine: "Ayurveda",
    studyType: "Interventional",
    phase: "Phase II",
    design: "Single-Centre, Open-Label, Pre-and-Post Interventional Study with 6-month Follow-up",
    targetPatients: 60,
    enrolled: 52,
    status: "Active - Follow-up",
    recruitmentStatus: "Ongoing",
    iecApprovalNumber: "AIIA/IEC/2022/08-19",
    iecApprovalDate: "2022-08-20",
    ctriRegistrationDate: "2022-09-05",
    isProspective: true,
    ndctCategory: "GCP-ASU Interventional",
    interventionName: "Standardized Virechana Protocol (Snehana -> Svedana -> Virechana with Trivrit Avaleha)",
    interventionFormulation: "Classical Panchakarma procedural regimen with standardized herbs",
    batchNumber: "TRIV-PAN-2022-04",
    standardizationMarker: "Operculin resin content verified per AFI monograph",
    comparatorArm: "Standard Topical Emollient Application Baseline Control",
    primaryEndpoint: "Psoriasis Area and Severity Index (PASI-75) response at 12 weeks",
    secondaryEndpoints: [
      "Dermatology Life Quality Index (DLQI)",
      "Relapse-free survival time over 6 months",
      "Serum electrolyte and renal safety monitoring"
    ],
    lastAuditDate: "2026-09-01",
    dsmbReviewDate: "2026-09-08"
  }
];

// ------------------------------------------------------------------------------------------------
// DETERMINISTIC CLINICAL COHORT GENERATOR (CDISC SDTM / GCP-ASU COMPLIANT)
// ------------------------------------------------------------------------------------------------

const PRAKRITI_TYPES = [
  "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Pitta-Vata", "Kapha-Vata", "Kapha-Pitta"
] as const;

const AGNI_TYPES = ["Vishama", "Tikshna", "Manda", "Sama"] as const;
const KOSTHA_TYPES = ["Mridu", "Madhyama", "Krura"] as const;

const INDIAN_GIVEN_NAMES_M = [
  "Ramesh", "Suresh", "Vijay", "Anand", "Rajesh", "Sunil", "Manoj", "Pradeep",
  "Alok", "Devendra", "Kishore", "Gopal", "Harish", "Mukesh", "Naresh", "Pankaj",
  "Rakesh", "Sanjay", "Vinod", "Ashok", "Bhaskar", "Chandan", "Dinesh", "Girish"
];

const INDIAN_GIVEN_NAMES_F = [
  "Sharda", "Sunita", "Ananya", "Meera", "Pooja", "Rekha", "Geeta", "Kavita",
  "Manju", "Neelam", "Pushpa", "Renu", "Sangeeta", "Usha", "Vandana", "Asha",
  "Bimla", "Chitra", "Deepa", "Indu", "Kamla", "Lata", "Madhu", "Nirmala"
];

const SURNAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Singh", "Yadav", "Kumar", "Mishra",
  "Iyer", "Joshi", "Bhatt", "Nair", "Das", "Banerjee", "Reddy", "Choudhury",
  "Tripathi", "Shukla", "Pandey", "Saxena", "Sen", "Pillai", "Trivedi", "Rao"
];

function generateTrialCohort(
  studyId: string,
  count: number,
  config: {
    minAge: number;
    maxAge: number;
    armA: { code: string; name: string };
    armB: { code: string; name: string };
    diagnosis: string;
    icd11: string;
    namaste: string;
    sites: { id: string; name: string }[];
    complaints: string[];
    startDate: string;
  }
): CdiscSdtmSubject[] {
  const subjects: CdiscSdtmSubject[] = [];

  for (let i = 1; i <= count; i++) {
    const isMale = (i * 7 + 3) % 10 < 5;
    const nameList = isMale ? INDIAN_GIVEN_NAMES_M : INDIAN_GIVEN_NAMES_F;
    const firstName = nameList[(i * 11) % nameList.length];
    const lastName = SURNAMES[(i * 13) % SURNAMES.length];
    const age = config.minAge + ((i * 17) % (config.maxAge - config.minAge + 1));
    const birthYear = 2026 - age;
    const birthMonth = String(((i * 3) % 12) + 1).padStart(2, "0");
    const birthDay = String(((i * 5) % 28) + 1).padStart(2, "0");

    const siteIdx = i % config.sites.length;
    const site = config.sites[siteIdx];
    const subjidStr = String(i).padStart(3, "0");
    const usubjid = `${studyId}-${site.id}-${subjidStr}`;

    const isArmA = i % 2 !== 0;
    const armcd = isArmA ? config.armA.code : config.armB.code;
    const actarm = isArmA ? config.armA.name : config.armB.name;

    const prakriti = PRAKRITI_TYPES[(i * 2) % PRAKRITI_TYPES.length];
    let vata = 30 + ((i * 7) % 30);
    let pitta = 25 + ((i * 11) % 30);
    let kapha = 100 - vata - pitta;
    if (kapha < 10) {
      kapha = 15;
      vata = 100 - pitta - kapha;
    }

    const agni = AGNI_TYPES[(i * 5) % AGNI_TYPES.length];
    const kostha = KOSTHA_TYPES[(i * 3) % KOSTHA_TYPES.length];

    const sysbp = 118 + ((i * 9) % 24);
    const diabp = 74 + ((i * 7) % 14);
    const pulse = 68 + ((i * 5) % 16);
    const temp = Number((98.2 + ((i % 5) * 0.1)).toFixed(1));
    const bmi = Number((21.5 + ((i * 3) % 75) * 0.1).toFixed(1));
    const weight = Number((54 + ((i * 7) % 30)).toFixed(1));

    const fbs = 84 + ((i * 13) % 40);
    const hba1c = Number((5.2 + ((i * 7) % 18) * 0.1).toFixed(1));
    const sgot = 18 + ((i * 7) % 20);
    const sgpt = 16 + ((i * 9) % 22);
    const serumCreatinine = Number((0.72 + ((i * 5) % 40) * 0.01).toFixed(2));
    const totalBilirubin = Number((0.4 + ((i * 3) % 6) * 0.1).toFixed(1));

    const abha1 = String(1000 + ((i * 37) % 9000));
    const abha2 = String(1000 + ((i * 43) % 9000));
    const abha3 = String(1000 + ((i * 59) % 9000));
    const abhaId = `91-${abha1}-${abha2}-${abha3}`;
    const abhaAddress = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${birthYear % 100}@abdm`;

    const consentType = i % 3 === 0 ? "Written e-Form" : i % 5 === 0 ? "Bilingual Digital Signature" : "Electronic Audio-Visual";
    const consentLanguage = i % 7 === 0 ? "Tamil" : i % 6 === 0 ? "Bengali" : i % 4 === 0 ? "English" : "Hindi";
    const consentStatus = "Valid - Granted";

    const compliance = 88 + ((i * 3) % 13);
    const visitStatus = i <= count * 0.4 ? "Completed" : i % 15 === 0 ? "Visit Missed" : "On Schedule";

    const complaint = config.complaints[i % config.complaints.length];

    subjects.push({
      studyId,
      domain: "DM",
      usubjid,
      subjid: subjidStr,
      siteId: site.id,
      siteName: site.name,
      brthdtc: `${birthYear}-${birthMonth}-${birthDay}`,
      age,
      ageu: "YEARS",
      sex: isMale ? "M" : "F",
      race: "ASIAN",
      ethnic: "INDIAN",
      armcd,
      actarm,
      country: "IND",
      rfstdtc: config.startDate,
      rfendtc: "2026-10-30",
      prakriti,
      prakritiDoshaScore: { vata, pitta, kapha },
      agni,
      kostha,
      dhatuSarata: "Majja & Meda Madhyama Sarata per GCP-ASU",
      primaryDiagnosis: config.diagnosis,
      presentingComplaints: complaint,
      diseaseDurationMonths: 6 + ((i * 3) % 36),
      icd11Code: config.icd11,
      namasteCode: config.namaste,
      baselineVitals: {
        sysbp,
        diabp,
        pulse,
        temp,
        bmi,
        weight
      },
      safetyLabs: {
        fbs,
        hba1c,
        sgot,
        sgpt,
        serumCreatinine,
        totalBilirubin
      },
      abhaId,
      abhaAddress,
      consentType,
      consentLanguage,
      consentTimestamp: `${config.startDate}T10:${String(10 + (i % 45)).padStart(2, "0")}:00Z`,
      consentStatus,
      dataMinimizationNoticeGiven: true,
      visitScheduleCompliance: compliance,
      visitStatus
    });
  }

  return subjects;
}

// Generate complete cohorts matching enrolled counts
const cohort1 = generateTrialCohort("AIIA-041852", 98, {
  minAge: 52,
  maxAge: 76,
  armA: { code: "ASHWA", name: "Ashwagandha 300mg BID" },
  armB: { code: "PLACEBO", name: "Matching Placebo Capsule BID" },
  diagnosis: "Mild Cognitive Impairment (Smriti Bhramsha)",
  icd11: "6D71 (Mild neurocognitive disorder)",
  namaste: "AYU-SM-041 (Smriti Daurbalya)",
  sites: [
    { id: "SITE01", name: "AIIA Main Hospital, New Delhi" },
    { id: "SITE02", name: "AIIA Peripheral Centre, Goa" },
    { id: "SITE03", name: "National Institute of Ayurveda (NIA), Jaipur" }
  ],
  complaints: [
    "Recent memory lapses and delayed word retrieval",
    "Difficulty recalling recent appointments and names",
    "Mental exhaustion and sleep fragmentation",
    "Mild confusion during multi-step daily tasks",
    "Cognitive fatigue in early afternoons"
  ],
  startDate: "2026-04-15"
});

const cohort2 = generateTrialCohort("AIIA-038102", 134, {
  minAge: 40,
  maxAge: 68,
  armA: { code: "GUDUCHI", name: "Guduchi Ghanavati 500mg TID" },
  armB: { code: "STDCARE", name: "Standard Care Lifestyle Guidance" },
  diagnosis: "Metabolic Syndrome (Prameha Poorvarupa)",
  icd11: "5B81 (Metabolic syndrome)",
  namaste: "AYU-PR-002 (Kaphaja Prameha)",
  sites: [
    { id: "SITE01", name: "AIIA OPD Site 01, New Delhi" },
    { id: "SITE02", name: "ITRA Jamnagar, Gujarat" },
    { id: "SITE03", name: "Govt Ayurvedic College, Thiruvananthapuram" }
  ],
  complaints: [
    "Polydipsia, increased fatigue and abdominal obesity",
    "Post-prandial heaviness and mild exertional dyspnea",
    "Elevated fasting glucose with sluggish digestion",
    "Frequent lethargy and joint stiffness in mornings"
  ],
  startDate: "2026-05-02"
});

const cohort3 = generateTrialCohort("AIIA-049812", 182, {
  minAge: 24,
  maxAge: 65,
  armA: { code: "AYUSH64", name: "Ayush-64 Tablets 1000mg BID" },
  armB: { code: "PLACEBO", name: "Identical Placebo Tablets" },
  diagnosis: "Post-Viral Chronic Fatigue Syndrome",
  icd11: "8E49 (Postviral fatigue syndrome)",
  namaste: "AYU-KL-008 (Klama & Dhatu Kshaya)",
  sites: [
    { id: "SITE01", name: "AIIA Post-Viral Clinic, New Delhi" },
    { id: "SITE02", name: "CCRAS Research Center, New Delhi" },
    { id: "SITE03", name: "IPGTRA Clinic, Jamnagar" }
  ],
  complaints: [
    "Profound exhaustion after mild exertion and brain fog",
    "Persistent unrefreshing sleep and widespread myalgia",
    "Post-exertional malaise lasting >24 hours",
    "Orthostatic dizziness and low stamina"
  ],
  startDate: "2026-06-10"
});

const cohort4 = generateTrialCohort("AIIA-054119", 64, {
  minAge: 20,
  maxAge: 55,
  armA: { code: "HARIDRA", name: "Haridra Khanda Granules 6g BD" },
  armB: { code: "LEVOCET", name: "Levocetirizine 5mg tablet OD" },
  diagnosis: "Allergic Rhinitis (Vataja Pratishyaya)",
  icd11: "CA08.0 (Allergic rhinitis)",
  namaste: "AYU-PR-019 (Pratishyaya)",
  sites: [
    { id: "SITE01", name: "AIIA Shalakya OPD, New Delhi" },
    { id: "SITE02", name: "State Ayurvedic College, Lucknow" }
  ],
  complaints: [
    "Morning sneezing paroxysms, watery rhinorrhea and itchy palate",
    "Bilateral nasal congestion aggravated in cold weather",
    "Allergic shiners and ocular pruritus"
  ],
  startDate: "2026-07-01"
});

const cohort5 = generateTrialCohort("AIIA-045821", 52, {
  minAge: 28,
  maxAge: 65,
  armA: { code: "VIRECHANA", name: "Standardized Virechana Karma Protocol" },
  armB: { code: "EMOLLIENT", name: "Standard Topical Emollient Control" },
  diagnosis: "Chronic Plaque Psoriasis (Eka Kushtha)",
  icd11: "EA90.0 (Psoriasis vulgaris)",
  namaste: "AYU-KU-003 (Eka Kushtha)",
  sites: [
    { id: "SITE01", name: "AIIA Inpatient Panchakarma Facility, New Delhi" }
  ],
  complaints: [
    "Erythematous plaques with silvery scaling on elbows and knees",
    "Severe pruritus and Auspitz sign positive",
    "Scalp scaling and skin dryness with burning sensation"
  ],
  startDate: "2026-07-15"
});

// Explicitly customize anchor subjects for pharmacovigilance safety events
// 1. Anchor subject 029 in AIIA-049812 (the SAE patient)
const saeSubject = cohort3.find((s) => s.usubjid === "AIIA-049812-SITE01-029");
if (saeSubject) {
  saeSubject.age = 38;
  saeSubject.sex = "F";
  saeSubject.brthdtc = "1988-03-19";
  saeSubject.abhaId = "91-9923-4819-1033";
  saeSubject.abhaAddress = "ananya.sen88@abdm";
  saeSubject.presentingComplaints = "Post-viral exhaustion, experienced acute periorbital and facial swelling after dose";
}

// 2. Anchor subject 014 in AIIA-038102 (the ADR patient)
const adrSubject = cohort2.find((s) => s.usubjid === "AIIA-038102-SITE01-014");
if (adrSubject) {
  adrSubject.age = 51;
  adrSubject.sex = "M";
  adrSubject.brthdtc = "1974-12-03";
  adrSubject.abhaId = "91-1192-3847-5620";
  adrSubject.abhaAddress = "vijay.sharma74@abdm";
}

// 3. Anchor subject 001 in AIIA-041852 (the mild AE patient)
const aeSubject = cohort1.find((s) => s.usubjid === "AIIA-041852-SITE01-001");
if (aeSubject) {
  aeSubject.age = 58;
  aeSubject.sex = "M";
  aeSubject.brthdtc = "1968-05-14";
  aeSubject.abhaId = "91-4821-3941-8012";
  aeSubject.abhaAddress = "p.raman58@abdm";
}

export const CDISC_SDTM_SUBJECTS: CdiscSdtmSubject[] = [
  ...cohort1,
  ...cohort2,
  ...cohort3,
  ...cohort4,
  ...cohort5
];

// ------------------------------------------------------------------------------------------------
// PHARMACOVIGILANCE SAFETY EVENTS (MedDRA Coded with 24-hr NDCT Rules 2019 Clock)
// ------------------------------------------------------------------------------------------------

export const PHARMACOVIGILANCE_RECORDS: PharmacovigilanceEvent[] = [
  {
    eventId: "NPVCC-2026-SAE-001",
    trialId: "AIIA-CT-2023-05",
    ctriNumber: "CTRI/2023/02/049812",
    trialShortTitle: "Ayush-64 in Post-Viral Chronic Fatigue & Inflammatory Sequelae",
    studyTitle: "Multi-Centric Pragmatic Clinical Trial on the Efficacy of Ayush-64 in Managing Post-Viral Chronic Fatigue and Inflammatory Sequelae",
    usubjid: "AIIA-049812-SITE01-029",
    patientAge: 38,
    patientSex: "F",
    eventType: "SAE",
    meddraSoc: "Immune system disorders",
    meddraPt: "Angioedema",
    meddraLlt: "Acute periorbital and facial swelling with urticaria",
    verbatimTerm: "Sudden onset severe facial swelling and generalized rash within 2 hours of dose",
    severity: "Severe",
    onsetDate: "2026-09-19T10:15:00Z", // Recent event to trigger live countdown
    reportedDate: "2026-09-19T11:30:00Z",
    suspectedDrug: "Ayush-64 Tablets (500mg)",
    formulationType: "Polyherbal extract tablet",
    batchNumber: "AY64-NPVCC-2023-A01",
    dailyDose: "2 tablets BID (1000mg BID)",
    route: "Oral",
    causalityScore: 6, // Probable on Naranjo Scale
    causalityCategory: "Probable",
    isSerious: true,
    seriousnessCriteria: "Hospitalization / Prolonged",
    notificationDue24h: "2026-09-20T11:30:00Z", // 24h clock under NDCT Rules 2019
    detailedReportDue14d: "2026-10-03T11:30:00Z", // 14-day clock
    dcgiNotificationStatus: "Pending Submission", // Requires immediate action!
    iecNotificationStatus: "Under Committee Review",
    sponsorNotificationStatus: "Notified",
    dsmbEscalated: true,
    actionTaken: "Study intervention permanently discontinued; IV hydrocortisone and antihistamines administered; subject admitted for observation",
    outcome: "Recovering",
    assignedOfficer: "Dr. Alka Kapoor (NPvCC Lead)"
  },
  {
    eventId: "NPVCC-2026-ADR-004",
    trialId: "AIIA-CT-2021-03",
    ctriNumber: "CTRI/2021/11/038102",
    trialShortTitle: "Guduchi Ghanavati in Metabolic Syndrome",
    studyTitle: "Clinical Evaluation of Guduchi Ghanavati (Tinospora cordifolia) as Add-on Therapy in Metabolic Syndrome (Prameha)",
    usubjid: "AIIA-038102-SITE01-014",
    patientAge: 51,
    patientSex: "M",
    eventType: "ADR",
    meddraSoc: "Gastrointestinal disorders",
    meddraPt: "Dyspepsia",
    meddraLlt: "Epigastric burning and bitter eructations",
    verbatimTerm: "Mild-to-moderate acid regurgitation 45 mins following Ghanavati ingestion",
    severity: "Moderate",
    onsetDate: "2026-08-22T14:00:00Z",
    reportedDate: "2026-08-23T09:00:00Z",
    suspectedDrug: "Guduchi Ghanavati (500mg)",
    formulationType: "Aqueous extract tablet",
    batchNumber: "GUD-AIIA-2021-08",
    dailyDose: "1 tablet TID",
    route: "Oral",
    causalityScore: 4, // Possible on Naranjo
    causalityCategory: "Possible",
    isSerious: false,
    notificationDue24h: "2026-08-24T09:00:00Z",
    detailedReportDue14d: "2026-09-06T09:00:00Z",
    dcgiNotificationStatus: "Submitted within 24h",
    iecNotificationStatus: "Submitted within 24h",
    sponsorNotificationStatus: "Notified",
    dsmbEscalated: false,
    actionTaken: "Advised administration with warm water immediately after meals; symptoms subsided without stopping trial",
    outcome: "Recovered completely",
    assignedOfficer: "Dr. R. K. Yadav"
  },
  {
    eventId: "NPVCC-2026-AE-009",
    trialId: "AIIA-CT-2022-01",
    ctriNumber: "CTRI/2022/04/041852",
    trialShortTitle: "Ashwagandha in Mild Cognitive Impairment (MCI)",
    studyTitle: "A Randomized, Double-Blind, Placebo-Controlled Study to Evaluate the Efficacy and Safety of Standardized Ashwagandha Extract in MCI",
    usubjid: "AIIA-041852-SITE01-001",
    patientAge: 58,
    patientSex: "M",
    eventType: "AE",
    meddraSoc: "Nervous system disorders",
    meddraPt: "Headache",
    meddraLlt: "Mild frontal throbbing headache",
    verbatimTerm: "Transient headache lasting 3 hours on Day 14",
    severity: "Mild",
    onsetDate: "2026-05-12T16:00:00Z",
    reportedDate: "2026-05-13T10:00:00Z",
    suspectedDrug: "Ashwagandha Extract (300mg)",
    formulationType: "Standardized extract capsule",
    batchNumber: "ASH-AIIA-2022-B04",
    dailyDose: "1 capsule BID",
    route: "Oral",
    causalityScore: 2, // Unlikely
    causalityCategory: "Unlikely",
    isSerious: false,
    notificationDue24h: "2026-05-14T10:00:00Z",
    detailedReportDue14d: "2026-05-27T10:00:00Z",
    dcgiNotificationStatus: "Submitted within 24h",
    iecNotificationStatus: "Submitted within 24h",
    sponsorNotificationStatus: "Notified",
    dsmbEscalated: false,
    actionTaken: "No dose modification; resolved spontaneously",
    outcome: "Recovered completely",
    assignedOfficer: "Dr. Priya Raman"
  }
];
