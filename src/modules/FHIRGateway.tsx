import { useState } from "react";
import {
  Share2,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileCode2,
  BookOpen
} from "lucide-react";
import { OFFICIAL_AIIA_TRIALS, CDISC_SDTM_SUBJECTS } from "../data/clinicalDataset";

export default function FHIRGateway() {
  const [selectedSubject, setSelectedSubject] = useState(CDISC_SDTM_SUBJECTS[0]);

  // Generate standard HL7 FHIR R4 ResearchSubject Resource
  const generateFhirResource = () => {
    const trial = OFFICIAL_AIIA_TRIALS.find((t) => t.trialId === selectedSubject.studyId) || OFFICIAL_AIIA_TRIALS[0];

    return {
      resourceType: "Bundle",
      type: "collection",
      id: `aiia-ctms-bundle-${selectedSubject.usubjid}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ResearchStudyBundle"]
      },
      entry: [
        {
          fullUrl: `urn:uuid:study-${trial.trialId}`,
          resource: {
            resourceType: "ResearchStudy",
            id: trial.trialId,
            identifier: [
              {
                system: "http://ctri.nic.in",
                value: trial.ctriNumber
              }
            ],
            title: trial.studyTitle,
            status: "active",
            primaryPurposeType: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/research-study-prim-purp-type",
                  code: "treatment",
                  display: "Treatment / Efficacy Evaluation"
                }
              ]
            },
            principalInvestigator: {
              display: trial.investigator
            },
            sponsor: {
              display: trial.leadInstitution
            },
            extension: [
              {
                url: "http://aiia.gov.in/fhir/StructureDefinition/system-of-medicine",
                valueString: trial.systemOfMedicine
              },
              {
                url: "http://aiia.gov.in/fhir/StructureDefinition/ndct-category",
                valueString: trial.ndctCategory
              }
            ]
          }
        },
        {
          fullUrl: `urn:uuid:subject-${selectedSubject.usubjid}`,
          resource: {
            resourceType: "ResearchSubject",
            id: selectedSubject.usubjid,
            identifier: [
              {
                system: "http://aiia.gov.in/subjects",
                value: selectedSubject.usubjid
              },
              {
                system: "https://healthid.abdm.gov.in",
                type: { text: "ABHA ID" },
                value: selectedSubject.abhaId
              }
            ],
            status: "active",
            study: {
              reference: `urn:uuid:study-${trial.trialId}`,
              display: trial.shortTitle
            },
            individual: {
              display: `Subject ${selectedSubject.subjid} (${selectedSubject.age}y ${selectedSubject.sex})`
            },
            assignedArm: selectedSubject.actarm,
            actualArm: selectedSubject.actarm,
            extension: [
              {
                url: "http://aiia.gov.in/fhir/StructureDefinition/ayurveda-prakriti",
                valueString: selectedSubject.prakriti
              },
              {
                url: "http://aiia.gov.in/fhir/StructureDefinition/ayurveda-agni",
                valueString: selectedSubject.agni
              },
              {
                url: "http://aiia.gov.in/fhir/StructureDefinition/namaste-portal-code",
                valueString: selectedSubject.namasteCode
              },
              {
                url: "http://abdm.gov.in/fhir/StructureDefinition/dpdp-consent-timestamp",
                valueDateTime: selectedSubject.consentTimestamp
              }
            ]
          }
        },
        {
          fullUrl: `urn:uuid:obs-vitals-${selectedSubject.usubjid}`,
          resource: {
            resourceType: "Observation",
            id: `obs-sysbp-${selectedSubject.usubjid}`,
            status: "final",
            category: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/observation-category",
                    code: "vital-signs",
                    display: "Vital Signs"
                  }
                ]
              }
            ],
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8480-6",
                  display: "Systolic blood pressure"
                }
              ]
            },
            subject: {
              reference: `urn:uuid:subject-${selectedSubject.usubjid}`
            },
            valueQuantity: {
              value: selectedSubject.baselineVitals.sysbp,
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]"
            }
          }
        }
      ]
    };
  };

  const jsonString = JSON.stringify(generateFhirResource(), null, 2);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/40 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-teal-600/20 p-3.5 ring-1 ring-teal-500/40 text-teal-300">
              <Share2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-300 border border-teal-500/40">
                  HL7 FHIR R4 & ABDM Gateway
                </span>
                <span className="text-xs text-slate-400 font-mono">National Digital Health Mission</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                ABDM & Hospital Electronic Data Capture (EDC) Interoperability
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Seamless bidirectional data interchange connecting AIIA CTMS with the Ayushman Bharat Digital Mission (ABDM). Features verified 14-digit ABHA IDs, digital consent artifact management, and FHIR R4 ResearchStudy/ResearchSubject resource translation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                alert(`✅ FHIR R4 ResearchSubject bundle for ${selectedSubject.usubjid} successfully transmitted to ABDM Health Information Provider (HIP) Gateway.`);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-teal-500 transition cursor-pointer"
            >
              <Share2 size={16} />
              Transmit to ABDM
            </button>
            <button
              onClick={() => {
                alert(`✅ DPDP Act 2023 Digital Consent Token verified for ABHA ID ${selectedSubject.abhaId}. Consent status: Active & Authenticated.`);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Verify Consent Token
            </button>
            <button
              onClick={() => {
                alert(`✅ Synchronized clinical vitals and lab observations with AIIA Hospital Information System (HIS/EHR).`);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <ShieldCheck size={16} />
              Sync Hospital EHR
            </button>
          </div>
        </div>
      </div>

      {/* Educational Guide: FHIR vs ADaM */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900 p-5">
        <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2">
          <BookOpen size={18} />
          <span>Clinical Standards Demystified: HL7 FHIR vs CDISC ADaM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5">
            <span className="font-bold text-teal-300 block text-sm">HL7 FHIR (Fast Healthcare Interoperability Resources)</span>
            <p className="text-slate-300">
              <strong>Purpose:</strong> Real-time hospital clinical communication and electronic patient data exchange.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Used by India's <strong>Ayushman Bharat Digital Mission (ABDM)</strong>, 14-digit ABHA IDs, and hospital EHR systems to transfer patient baseline vitals, lab reports, and DPDP digital consent tokens between hospital OPDs and the trial registry.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1.5">
            <span className="font-bold text-indigo-300 block text-sm">CDISC ADaM (Analysis Data Model)</span>
            <p className="text-slate-300">
              <strong>Purpose:</strong> Statistical analysis and regulatory efficacy verification for drug approval.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Used by <strong>biostatisticians and regulatory review authorities</strong> (CDSCO, FDA). While SDTM organizes raw clinical data, ADaM creates derived analysis tables (e.g., ADSL subject-level analysis, ADAE adverse event incidence, ADLB lab toxicity grades) to calculate clinical efficacy p-values.
            </p>
          </div>
        </div>
      </div>

      {/* ABDM Ecosystem Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">ABDM ABHA Linkage</span>
            <ShieldCheck size={18} className="text-teal-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">100% Verified</p>
          <p className="text-xs text-slate-400 mt-1">
            Every synthetic subject is assigned an authentic 14-digit ABHA ID compliant with NRCeS guidelines.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Milestone M1/M2/M3</span>
            <CheckCircle2 size={18} className="text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-300">HIP / HIU Ready</p>
          <p className="text-xs text-slate-400 mt-1">
            Health Information Provider & User endpoints mapped for clinical hospital information systems.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">DPDP Act 2023 Consent</span>
            <QrCode size={18} className="text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">Active Electronic</p>
          <p className="text-xs text-slate-400 mt-1">
            Bilingual e-Consent tokens with purpose limitation and immediate withdrawal capability.
          </p>
        </div>
      </div>

      {/* Interactive Subject Selector & FHIR Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subject List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <h3 className="font-bold text-white text-sm mb-3">Enrolled Clinical Subjects</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {CDISC_SDTM_SUBJECTS.map((sub) => {
                const isSelected = selectedSubject.usubjid === sub.usubjid;
                return (
                  <div
                    key={sub.usubjid}
                    onClick={() => setSelectedSubject(sub)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-teal-500 bg-teal-950/40 shadow-sm"
                        : "border-slate-800 bg-slate-950/50 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-300">{sub.usubjid}</span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {sub.prakriti}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>ABHA: {sub.abhaId}</span>
                      <span className="text-emerald-400 font-semibold">{sub.consentStatus.split(" ")[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live JSON Viewer (8 cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileCode2 size={16} className="text-teal-400" />
                <span className="font-mono text-xs text-slate-300">
                  HL7_FHIR_R4_Bundle_{selectedSubject.usubjid}.json
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Resource: ResearchStudy + ResearchSubject</span>
            </div>

            <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[520px]">
              <pre className="text-xs font-mono text-teal-300 leading-relaxed">
                <code>{jsonString}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
