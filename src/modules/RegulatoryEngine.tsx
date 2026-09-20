import { useState } from "react";
import {
  FileCheck2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Download,
  Calendar,
  Clock,
  Award,
  Globe,
  Radio,
  Send,
  Plus,
  X
} from "lucide-react";
import type { CtriTrial } from "../data/clinicalDataset";
import { OFFICIAL_AIIA_TRIALS } from "../data/clinicalDataset";
import { downloadRegulatoryCertificatePdf } from "../utils/pdfGenerator";
import {
  type CtriSubmissionRecord,
  getCtriSubmissions,
  submitTrialToCtri
} from "../services/ctriGateway";

export default function RegulatoryEngine() {
  const [selectedTrial, setSelectedTrial] = useState<CtriTrial>(OFFICIAL_AIIA_TRIALS[0]);
  const [ctriSubmissions, setCtriSubmissions] = useState<CtriSubmissionRecord[]>(getCtriSubmissions());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newProtocolTitle, setNewProtocolTitle] = useState("");
  const [newProtocolPhase, setNewProtocolPhase] = useState("Phase III Multi-Centric");
  const [newProtocolPi, setNewProtocolPi] = useState("Prof. (Dr.) Tanuja Nesari");

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-600/20 p-3.5 ring-1 ring-blue-500/40 text-blue-300">
              <FileCheck2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-300 border border-blue-500/40">
                  CTRI & NDCT Rules 2019 Hub
                </span>
                <span className="text-xs text-slate-400 font-mono">GCP-ASU & ICMR Ethical Norms</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Clinical Trial Regulatory & Ethics Milestone Engine
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Ensuring mandatory prospective registration in the Clinical Trials Registry – India (ctri.nic.in), Institutional Ethics Committee (IEC) oversight, and full compliance with the New Drugs and Clinical Trials Rules, 2019 for ASU medicine.
              </p>
            </div>
          </div>

          <a
            href="https://ctri.nic.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition cursor-pointer"
          >
            <ExternalLink size={16} />
            Verify on CTRI Portal
          </a>
        </div>
      </div>

      {/* Trial Selector & Regulatory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Study List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <h3 className="font-bold text-white text-sm mb-3">Portfolio Regulatory Dossiers</h3>
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {OFFICIAL_AIIA_TRIALS.map((trial) => {
                const isSelected = selectedTrial.trialId === trial.trialId;
                return (
                  <div
                    key={trial.trialId}
                    onClick={() => setSelectedTrial(trial)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/40 shadow-sm"
                        : "border-slate-800 bg-slate-950/50 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-300">{trial.ctriNumber}</span>
                      <span className="rounded-full bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        Prospective
                      </span>
                    </div>
                    <p className="font-bold text-white text-sm mt-2 line-clamp-1">{trial.shortTitle}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">PI: {trial.investigator}</p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>IEC: {trial.iecApprovalNumber}</span>
                      <span className="text-teal-300 font-semibold">{trial.ndctCategory}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Detailed Regulatory Lifecycle (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  {selectedTrial.systemOfMedicine} Research • {selectedTrial.phase}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedTrial.studyTitle}</h2>
                <p className="text-xs text-slate-400 mt-1">Lead: {selectedTrial.leadInstitution}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 border border-emerald-600 px-3 py-1 text-xs font-bold text-emerald-300">
                  <CheckCircle2 size={14} /> Prospective CTRI Validated
                </span>
              </div>
            </div>

            {/* Regulatory Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-slate-500 uppercase font-semibold">CTRI Registration</p>
                <p className="font-mono text-sm font-bold text-blue-300 mt-1">{selectedTrial.ctriNumber}</p>
                <p className="text-slate-400 mt-0.5">Registered: {selectedTrial.ctriRegistrationDate}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-slate-500 uppercase font-semibold">Ethics Clearance (IEC)</p>
                <p className="font-mono text-sm font-bold text-teal-300 mt-1">{selectedTrial.iecApprovalNumber}</p>
                <p className="text-slate-400 mt-0.5">Approved: {selectedTrial.iecApprovalDate}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-slate-500 uppercase font-semibold">NDCT 2019 Category</p>
                <p className="font-bold text-sm text-indigo-300 mt-1">{selectedTrial.ndctCategory}</p>
                <p className="text-slate-400 mt-0.5">ICMR 2017 & GCP-ASU</p>
              </div>
            </div>

            {/* Lifecycle Stages Pathway */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Clinical Trial Regulatory Milestone Progression
              </h4>
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: "Scientific Advisory Committee (SAC) Clearance",
                    desc: "Methodological review, sample size justification, and botanical standardization approval.",
                    status: "Completed",
                    date: "Verified"
                  },
                  {
                    step: 2,
                    title: "Institutional Ethics Committee (IEC) Full-Board Approval",
                    desc: "Vulnerable population safeguards, audio-visual e-consent format, and clinical compensation clauses.",
                    status: "Completed",
                    date: selectedTrial.iecApprovalDate
                  },
                  {
                    step: 3,
                    title: "Prospective Registration in CTRI (ctri.nic.in)",
                    desc: "Registration granted BEFORE enrollment of the first participant (Mandatory compliance).",
                    status: "Completed",
                    date: selectedTrial.ctriRegistrationDate
                  },
                  {
                    step: 4,
                    title: "Multi-Center Site Activation & GCP-ASU Training",
                    desc: "Investigator meetings, delegation logs, and standard drug batch distribution.",
                    status: "Completed",
                    date: "Active"
                  },
                  {
                    step: 5,
                    title: "Subject Recruitment & Longitudinal Safety Oversight (DSMB)",
                    desc: "Periodic safety interim evaluations and pharmacovigilance causality audits.",
                    status: "Ongoing",
                    date: `Enrolled: ${selectedTrial.enrolled}/${selectedTrial.targetPatients}`
                  },
                  {
                    step: 6,
                    title: "Database Lock, CDISC SDTM/Define-XML Dossier & Closeout",
                    desc: "Final clinical study report (CSR) submission to CDSCO and Ministry of Ayush.",
                    status: "Scheduled",
                    date: "Pending Data Lock"
                  }
                ].map((stage) => (
                  <div
                    key={stage.step}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        stage.status === "Completed"
                          ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                          : stage.status === "Ongoing"
                          ? "bg-blue-600 text-white animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {stage.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white text-sm">{stage.title}</p>
                        <span
                          className={`text-xs font-semibold ${
                            stage.status === "Completed"
                              ? "text-emerald-400"
                              : stage.status === "Ongoing"
                              ? "text-blue-400"
                              : "text-slate-500"
                          }`}
                        >
                          {stage.status} ({stage.date})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{stage.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CDSCO Regulatory Inspection & Certificate Card */}
            <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-600/20 p-2.5 text-blue-300 border border-blue-500/30">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      CDSCO / Ministry of Ayush On-Site Regulatory Inspection
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Periodic Good Clinical Practice (GCP-ASU) Compliance Verification
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-950/80 border border-emerald-600/60 px-3 py-1 text-xs font-bold text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto">
                  <Award size={14} />
                  GCP-ASU Certified
                </span>
              </div>

              {/* Inspection Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 uppercase font-semibold text-[10px]">
                    <Calendar size={13} className="text-blue-400" />
                    <span>Last Inspection Date</span>
                  </div>
                  <p className="font-bold text-slate-100 mt-1.5 text-sm">18-Aug-2025</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-teal-400" /> 11:30 AM IST
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Inspecting Authority</p>
                  <p className="font-bold text-slate-100 mt-1.5 line-clamp-1">CDSCO North Zone & MoA</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ayush Inspection Cell</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Lead Inspector</p>
                  <p className="font-bold text-slate-100 mt-1.5">Dr. S. K. Sharma</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Deputy Drugs Controller</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Inspection Outcome</p>
                  <p className="font-bold text-emerald-300 mt-1.5">Zero Deviations</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Valid till 17-Aug-2026</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-400">
                  Certificate Ref: <span className="font-mono text-blue-300 font-semibold">CDSCO/GCP-ASU/2025/DEL-{selectedTrial.ctriNumber.slice(-6)}</span>
                </p>

                <button
                  type="button"
                  onClick={() => {
                    downloadRegulatoryCertificatePdf(selectedTrial, {
                      inspectionDate: "18-Aug-2025",
                      inspectionTime: "11:30 AM IST",
                      inspectorName: "Dr. S. K. Sharma (Deputy Drugs Controller, Ayush)",
                      authority: "Central Drugs Standard Control Organisation (CDSCO) North Zone & Ayush Inspection Cell",
                      findings: "Approved with Zero Critical Deviations (Compliant under Rule 42 & NDCT Rules 2019)",
                      certificateNumber: `CDSCO/GCP-ASU/2025/DEL-${selectedTrial.ctriNumber.slice(-6)}`,
                      validTill: "17-Aug-2026"
                    });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-blue-500 transition cursor-pointer"
                >
                  <Download size={15} />
                  Download Regulatory Certificate (PDF)
                </button>
              </div>
            </div>

            {/* Ayurvedic Formulation Quality Standardization Card */}
            <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 uppercase tracking-wide">
                  Ayurvedic Pharmacopoeia (API) Drug Standardization
                </span>
                <span className="font-mono text-amber-400">Batch: {selectedTrial.batchNumber}</span>
              </div>
              <p className="text-slate-200">
                <span className="text-slate-400">Intervention:</span> {selectedTrial.interventionName}
              </p>
              <p className="text-slate-200">
                <span className="text-slate-400">Quality Marker:</span> {selectedTrial.standardizationMarker}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live CTRI Webhook & Government Server Gateway Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                <Radio size={12} className="text-emerald-400 animate-pulse" /> Live Server Webhook (ctri.nic.in)
              </span>
              <span className="text-xs text-slate-400 font-mono">ICMR-NIMS Gateway</span>
            </div>
            <h2 className="text-xl font-bold text-white">CTRI Protocol Submission & Acknowledgment Tracking</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated submission pipeline transmitting trial protocols to the National Clinical Trials Registry with provisional ACK tokens and status webhooks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:shadow-teal-500/20 transition cursor-pointer"
          >
            <Plus size={15} />
            + Submit New Protocol to CTRI
          </button>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold">
                <th className="py-3 px-4">Provisional ACK Number</th>
                <th className="py-3 px-4">Study Protocol</th>
                <th className="py-3 px-4">Principal Investigator</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">CTRI Webhook Status</th>
                <th className="py-3 px-4 text-right">Security Seal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ctriSubmissions.map((sub) => (
                <tr key={sub.ackNumber} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-300 whitespace-nowrap">
                    {sub.ackNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white line-clamp-1">{sub.trialName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub.phase} • IEC: {sub.ethicsApprovalNumber}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                    <p className="font-medium text-white">{sub.piName}</p>
                    <p className="text-xs text-slate-500 font-mono">{sub.piRegNumber}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                    {sub.formattedDate}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      sub.status === "Registered (Official CTRI ID)"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                        : sub.status === "Ethics Clearance Verified"
                        ? "bg-blue-950/80 text-blue-300 border border-blue-700/60"
                        : "bg-amber-950/80 text-amber-300 border border-amber-700/60"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                    {sub.sha256Seal.slice(0, 12)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protocol Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-teal-400" />
                <h3 className="text-lg font-bold text-white">Submit Protocol to CTRI Gateway</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Study / Protocol Title</label>
                <input
                  type="text"
                  placeholder="e.g. Brahmi (Bacopa monnieri) Clinical Trial in Mild Cognitive Impairment"
                  value={newProtocolTitle}
                  onChange={(e) => setNewProtocolTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinical Trial Phase</label>
                <select
                  value={newProtocolPhase}
                  onChange={(e) => setNewProtocolPhase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="Phase I Safety">Phase I Safety Evaluation</option>
                  <option value="Phase II Exploratory">Phase II Dose-Ranging & Exploratory</option>
                  <option value="Phase III Multi-Centric">Phase III Multi-Centric Confirmatory</option>
                  <option value="Phase IV Post-Marketing">Phase IV Post-Marketing Surveillance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Principal Investigator</label>
                <input
                  type="text"
                  value={newProtocolPi}
                  onChange={(e) => setNewProtocolPi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newProtocolTitle.trim()) {
                    alert("Please enter a protocol title.");
                    return;
                  }
                  const newRec = submitTrialToCtri({
                    title: newProtocolTitle.trim(),
                    phase: newProtocolPhase,
                    piName: newProtocolPi.trim()
                  });
                  setCtriSubmissions(getCtriSubmissions());
                  setShowSubmitModal(false);
                  setNewProtocolTitle("");
                  alert(`✅ Protocol successfully submitted to CTRI Gateway!\nProvisional Acknowledgment: ${newRec.ackNumber}\nWebhook Registered: ${newRec.webhookEndpoint}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-xs font-semibold shadow-lg hover:shadow-teal-500/20 cursor-pointer"
              >
                <Send size={13} />
                Transmit Protocol to CTRI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
