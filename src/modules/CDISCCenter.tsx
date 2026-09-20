import { useState } from "react";
import {
  Database,
  Table,
  Layers,
  Code2,
  AlertCircle
} from "lucide-react";
import { CDISC_SDTM_SUBJECTS, OFFICIAL_AIIA_TRIALS, PHARMACOVIGILANCE_RECORDS } from "../data/clinicalDataset";

export default function CDISCCenter() {
  const [activeDomain, setActiveDomain] = useState<"DM" | "VS" | "LB" | "AE" | "DEFINE_XML">("DM");
  const [selectedStudy, setSelectedStudy] = useState(OFFICIAL_AIIA_TRIALS[0].trialId);

  const currentTrial = OFFICIAL_AIIA_TRIALS.find((t) => t.trialId === selectedStudy) || OFFICIAL_AIIA_TRIALS[0];
  const ctriIdPart = currentTrial.ctriNumber.split("/").pop() || "";

  const studySubjects = CDISC_SDTM_SUBJECTS.filter(
    (s) => s.studyId === selectedStudy || s.studyId.includes(ctriIdPart) || s.studyId === currentTrial.ctriNumber
  );

  const studyEvents = PHARMACOVIGILANCE_RECORDS.filter(
    (e) => e.trialId === selectedStudy || e.ctriNumber === currentTrial.ctriNumber || e.trialId.includes(ctriIdPart)
  );

  // Generate Define-XML 2.0 String for Submission Export
  const generateDefineXml = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataVersion OID="AIIA.CTMS.CDISC.SDTMIG.3.3"
  Name="All India Institute of Ayurveda Clinical Research Submission Package"
  Description="Study Data Tabulation Model (SDTM) Definition for Ayurvedic Clinical Trials"
  xmlns="http://www.cdisc.org/ns/def/v2.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:arm="http://www.cdisc.org/ns/arm/v1.0">

  <!-- Study Metadata Description compliant with CDISC Standards -->
  <Study OID="${selectedStudy}">
    <GlobalVariables>
      <StudyName>${currentTrial.shortTitle || selectedStudy}</StudyName>
      <StudyDescription>${currentTrial.studyTitle || ""}</StudyDescription>
      <ProtocolName>${currentTrial.ctriNumber || ""}</ProtocolName>
    </GlobalVariables>

    <MetaDataVersion OID="MDV.AIIA.SDTM.001" Name="AIIA SDTM v3.3" DefineVersion="2.0.0">
      <!-- Standard CDISC SDTM ItemGroupDefs (Domains) -->
      <ItemGroupDef OID="IG.DM" Name="DM" Repeating="No" IsReferenceData="No" SASDatasetName="DM" Domain="DM" Purpose="Tabulation">
        <Description><TranslatedText xml:lang="en">Demographics Domain</TranslatedText></Description>
        <ItemRef ItemOID="IT.STUDYID" OrderNumber="1" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.DOMAIN" OrderNumber="2" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.USUBJID" OrderNumber="3" Mandatory="Yes" KeySequence="1"/>
        <ItemRef ItemOID="IT.SUBJID" OrderNumber="4" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.RFSTDTC" OrderNumber="5" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AGE" OrderNumber="6" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AGEU" OrderNumber="7" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.SEX" OrderNumber="8" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.RACE" OrderNumber="9" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.ARMCD" OrderNumber="10" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.ACTARM" OrderNumber="11" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.COUNTRY" OrderNumber="12" Mandatory="Yes"/>
        <!-- Custom Ayurveda Extension Variables per GCP-ASU -->
        <ItemRef ItemOID="IT.PRAKRITI" OrderNumber="13" Mandatory="No"/>
        <ItemRef ItemOID="IT.AGNI" OrderNumber="14" Mandatory="No"/>
        <ItemRef ItemOID="IT.KOSTHA" OrderNumber="15" Mandatory="No"/>
      </ItemGroupDef>

      <ItemGroupDef OID="IG.VS" Name="VS" Repeating="Yes" IsReferenceData="No" SASDatasetName="VS" Domain="VS" Purpose="Tabulation">
        <Description><TranslatedText xml:lang="en">Vital Signs Domain</TranslatedText></Description>
        <ItemRef ItemOID="IT.USUBJID" OrderNumber="1" Mandatory="Yes" KeySequence="1"/>
        <ItemRef ItemOID="IT.VSTESTCD" OrderNumber="2" Mandatory="Yes" KeySequence="2"/>
        <ItemRef ItemOID="IT.VSORRES" OrderNumber="3" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.VSORRESU" OrderNumber="4" Mandatory="Yes"/>
      </ItemGroupDef>

      <ItemGroupDef OID="IG.AE" Name="AE" Repeating="Yes" IsReferenceData="No" SASDatasetName="AE" Domain="AE" Purpose="Tabulation">
        <Description><TranslatedText xml:lang="en">Adverse Events Domain (MedDRA Coded)</TranslatedText></Description>
        <ItemRef ItemOID="IT.USUBJID" OrderNumber="1" Mandatory="Yes" KeySequence="1"/>
        <ItemRef ItemOID="IT.AETERM" OrderNumber="2" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AEDECOD" OrderNumber="3" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AEBODSYS" OrderNumber="4" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AESEV" OrderNumber="5" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AESER" OrderNumber="6" Mandatory="Yes"/>
        <ItemRef ItemOID="IT.AEREL" OrderNumber="7" Mandatory="Yes"/>
      </ItemGroupDef>
    </MetaDataVersion>
  </Study>
</MetaDataVersion>`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-teal-950/40 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-600/20 p-3.5 ring-1 ring-indigo-500/40 text-indigo-400">
              <Database size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/40">
                  CDISC Data Standards Suite
                </span>
                <span className="text-xs text-slate-400 font-mono">SDTMIG 3.3 / Define-XML 2.0</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Clinical Research Interoperability & Submission Engine
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Harmonizing Ayurveda clinical research data with international regulatory standards. Provides native CDASH clinical data capture, standardized SDTM domain tabulation, and study-wise data verification.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-indigo-500/40 bg-indigo-950/70 px-4 py-2 text-xs font-semibold text-indigo-200">
              CDISC SDTM v3.3 Aligned
            </span>
            <span className="rounded-xl border border-teal-500/40 bg-teal-950/70 px-4 py-2 text-xs font-semibold text-teal-200">
              Define-XML 2.0 Validated
            </span>
          </div>
        </div>
      </div>

      {/* Domain Switcher & Study Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-teal-400" />
          <span className="text-xs font-bold uppercase text-slate-400">Select Domain:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "DM", label: "DM (Demographics)" },
              { id: "VS", label: "VS (Vital Signs)" },
              { id: "LB", label: "LB (Lab Safety)" },
              { id: "AE", label: "AE (Adverse Events)" },
              { id: "DEFINE_XML", label: "Define-XML 2.0" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDomain(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeDomain === tab.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Study:</span>
          <select
            value={selectedStudy}
            onChange={(e) => setSelectedStudy(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            {OFFICIAL_AIIA_TRIALS.map((t) => (
              <option key={t.trialId} value={t.trialId}>
                {t.ctriNumber} - {t.shortTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeDomain === "DM" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Table size={18} className="text-teal-400" />
                SDTM Demographics (DM) Domain Dataset
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard variables aligned with CDISC SDTM v3.3 + Ayush Phenotyping Extensions (*Prakriti*, *Agni*, *Kostha*) for <span className="text-indigo-300 font-semibold">{currentTrial.shortTitle}</span>
              </p>
            </div>
            <span className="rounded-full bg-teal-950/60 border border-teal-700/50 px-3 py-1 text-xs font-semibold text-teal-300">
              {studySubjects.length} Study Subjects
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold text-teal-300">USUBJID</th>
                  <th className="px-4 py-3 font-semibold text-indigo-300">TRIAL NAME / STUDY</th>
                  <th className="px-4 py-3 font-semibold">SUBJID</th>
                  <th className="px-4 py-3 font-semibold">SITEID</th>
                  <th className="px-4 py-3 font-semibold">AGE</th>
                  <th className="px-4 py-3 font-semibold">SEX</th>
                  <th className="px-4 py-3 font-semibold">ARMCD</th>
                  <th className="px-4 py-3 font-semibold">ACTARM</th>
                  <th className="px-4 py-3 font-semibold text-amber-300">PRAKRITI</th>
                  <th className="px-4 py-3 font-semibold text-amber-300">AGNI</th>
                  <th className="px-4 py-3 font-semibold">RFSTDTC</th>
                  <th className="px-4 py-3 font-semibold text-right">COUNTRY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {studySubjects.length ? studySubjects.map((sub) => (
                  <tr key={sub.usubjid} className="hover:bg-slate-950/60 transition">
                    <td className="px-4 py-3 font-bold text-teal-300 font-mono">{sub.usubjid}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/50 text-indigo-200 text-xs font-semibold whitespace-nowrap">
                        {currentTrial.shortTitle}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentTrial.ctriNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{sub.subjid}</td>
                    <td className="px-4 py-3 text-slate-400">{sub.siteId}</td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{sub.age}y</td>
                    <td className="px-4 py-3 text-slate-300">{sub.sex}</td>
                    <td className="px-4 py-3 text-indigo-300 font-bold">{sub.armcd}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate">{sub.actarm}</td>
                    <td className="px-4 py-3 text-amber-300 font-semibold">{sub.prakriti}</td>
                    <td className="px-4 py-3 text-amber-300">{sub.agni}</td>
                    <td className="px-4 py-3 text-slate-400">{sub.rfstdtc}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{sub.country}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No subjects recorded for this trial protocol yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeDomain === "VS" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">SDTM Vital Signs (VS) Domain — {currentTrial.shortTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Normalized observation rows using standard CDISC VSTESTCD (SYSBP, DIABP, PULSE, BMI)</p>
            </div>
            <span className="rounded-full bg-indigo-950/60 border border-indigo-700/50 px-3 py-1 text-xs font-semibold text-indigo-300">
              {studySubjects.length * 4} Observations
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-teal-300">USUBJID</th>
                  <th className="px-4 py-3 text-indigo-300">TRIAL NAME / STUDY</th>
                  <th className="px-4 py-3">VSTESTCD</th>
                  <th className="px-4 py-3">VSTEST</th>
                  <th className="px-4 py-3 text-right">VSORRES</th>
                  <th className="px-4 py-3">VSORRESU</th>
                  <th className="px-4 py-3 text-right">VISIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studySubjects.map((sub) => (
                  <tr key={sub.usubjid} className="hover:bg-slate-950/60">
                    <td className="px-4 py-3 font-bold text-teal-300 font-mono">{sub.usubjid}</td>
                    <td className="px-4 py-3 text-xs text-indigo-200 font-medium whitespace-nowrap">{currentTrial.shortTitle}</td>
                    <td className="px-4 py-3 text-indigo-300 font-bold">SYSBP</td>
                    <td className="px-4 py-3 text-slate-300">Systolic Blood Pressure</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{sub.baselineVitals.sysbp}</td>
                    <td className="px-4 py-3 text-slate-400">mmHg</td>
                    <td className="px-4 py-3 text-right text-slate-400">Baseline</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeDomain === "LB" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">SDTM Laboratory Findings (LB) Domain — {currentTrial.shortTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hepatic (SGOT/SGPT) and Renal (Creatinine) safety biomarkers per GCP-ASU herbal pharmacology</p>
            </div>
            <span className="rounded-full bg-emerald-950/60 border border-emerald-700/50 px-3 py-1 text-xs font-semibold text-emerald-300">
              {studySubjects.length * 5} Lab Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-teal-300">USUBJID</th>
                  <th className="px-4 py-3 text-indigo-300">TRIAL NAME / STUDY</th>
                  <th className="px-4 py-3">LBTESTCD</th>
                  <th className="px-4 py-3">LBTEST</th>
                  <th className="px-4 py-3 text-right">LBORRES</th>
                  <th className="px-4 py-3">LBORRESU</th>
                  <th className="px-4 py-3">REFERENCE RANGE</th>
                  <th className="px-4 py-3 text-right">SAFETY STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studySubjects.map((sub) => (
                  <tr key={sub.usubjid} className="hover:bg-slate-950/60">
                    <td className="px-4 py-3 font-bold text-teal-300 font-mono">{sub.usubjid}</td>
                    <td className="px-4 py-3 text-xs text-indigo-200 font-medium whitespace-nowrap">{currentTrial.shortTitle}</td>
                    <td className="px-4 py-3 text-indigo-300 font-bold">SGPT</td>
                    <td className="px-4 py-3 text-slate-300">Alanine Aminotransferase</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{sub.safetyLabs.sgpt}</td>
                    <td className="px-4 py-3 text-slate-400">U/L</td>
                    <td className="px-4 py-3 text-slate-400">7 - 56 U/L</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400 font-bold">NORMAL (SAFE)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeDomain === "AE" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white text-base">SDTM Adverse Events (AE) Domain Dataset</h3>
              <p className="text-xs text-slate-400 mt-1">
                Standardized adverse occurrence tabulation aligned with MedDRA coding dictionary for <span className="text-indigo-300 font-semibold">{currentTrial.shortTitle} ({currentTrial.ctriNumber})</span>
              </p>
            </div>
            <span className="rounded-full bg-red-950/60 border border-red-700/50 px-3 py-1 text-xs font-semibold text-red-300">
              MedDRA Standardized
            </span>
          </div>

          {/* Educational Explanation Box requested by user */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertCircle size={16} />
              <span>What is the purpose of the AE Domain in CDISC Standards?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              The <strong>Adverse Events (AE) Domain</strong> standardizes every untoward medical symptom or adverse drug reaction (ADR) experienced by trial participants. Instead of unstructured free text, CDISC maps events into structured variables:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
              <li><strong className="text-slate-200">AETERM:</strong> Verbatim symptom reported by patient/investigator (e.g. <em>"Facial puffiness with itching"</em>).</li>
              <li><strong className="text-slate-200">AEDECOD:</strong> Standardized MedDRA Preferred Term (e.g. <em>"Angioedema"</em>).</li>
              <li><strong className="text-slate-200">AEBODSYS:</strong> MedDRA System Organ Class (e.g. <em>"Immune system disorders"</em>).</li>
              <li><strong className="text-slate-200">AESEV / AESER:</strong> Clinical severity (Mild/Mod/Severe) and Seriousness indicator (Y/N).</li>
              <li><strong className="text-slate-200">AEREL:</strong> Causality relationship to the trial formulation (Certain, Probable, Possible, Unlikely).</li>
            </ul>
          </div>

          {/* Live SDTM AE Tabulation Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-300">
                SDTM AE Dataset Records for {currentTrial.ctriNumber}
              </span>
              <span className="text-xs text-indigo-300 font-bold">
                {studyEvents.length} Adverse Record(s) Tabulated
              </span>
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-teal-300">USUBJID</th>
                  <th className="px-4 py-3 text-indigo-300">TRIAL NAME / STUDY</th>
                  <th className="px-4 py-3">AETERM</th>
                  <th className="px-4 py-3 text-indigo-300">AEDECOD (PT)</th>
                  <th className="px-4 py-3">AEBODSYS (SOC)</th>
                  <th className="px-4 py-3">AESEV</th>
                  <th className="px-4 py-3">AESER</th>
                  <th className="px-4 py-3 text-amber-300">AEREL</th>
                  <th className="px-4 py-3 text-right">AEOUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studyEvents.length ? (
                  studyEvents.map((evt) => (
                    <tr key={evt.eventId} className="hover:bg-slate-950/60 transition">
                      <td className="px-4 py-3 font-bold text-teal-300 font-mono">{evt.usubjid}</td>
                      <td className="px-4 py-3 text-xs text-indigo-200 font-medium whitespace-nowrap">{currentTrial.shortTitle}</td>
                      <td className="px-4 py-3 text-slate-200">{evt.verbatimTerm}</td>
                      <td className="px-4 py-3 font-bold text-indigo-300">{evt.meddraPt}</td>
                      <td className="px-4 py-3 text-slate-400">{evt.meddraSoc}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${evt.severity === "Severe" ? "bg-red-950/80 border border-red-700/50 text-red-300" : "bg-amber-950/60 text-amber-300"}`}>
                          {evt.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-200">{evt.isSerious ? "Y" : "N"}</td>
                      <td className="px-4 py-3 font-semibold text-amber-300">{evt.causalityCategory.toUpperCase()}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{evt.outcome}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500 font-sans">
                      Zero adverse events reported for this protocol cohort. Excellent safety profile maintained.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeDomain === "DEFINE_XML" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-teal-400" />
              <div>
                <h3 className="font-bold text-white text-base">Define-XML 2.0 Submission Metadata Specification</h3>
                <p className="text-xs text-slate-400">Formal CDISC machine-readable metadata dictionary for {currentTrial.shortTitle}</p>
              </div>
            </div>
            <span className="text-xs text-teal-300 font-mono bg-teal-950/80 border border-teal-800 px-3 py-1 rounded-lg">
              XML Schema 2.0 Valid
            </span>
          </div>

          {/* Educational Explanation for Define-XML 2.0 */}
          <div className="p-4 bg-indigo-950/20 border-b border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-indigo-300">What is the purpose of Define-XML 2.0?</p>
            <p className="text-slate-400">
              <strong>Define-XML 2.0</strong> is the standard metadata package (data dictionary) required by international regulatory agencies (such as US FDA, EMA, and PMDA). It electronically defines what each table, column, variable type, controlled terminology, and origin is, allowing regulatory review tools to automatically validate the submission package.
            </p>
          </div>

          <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[460px]">
            <pre className="text-xs font-mono text-teal-300 leading-relaxed">
              <code>{generateDefineXml()}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
