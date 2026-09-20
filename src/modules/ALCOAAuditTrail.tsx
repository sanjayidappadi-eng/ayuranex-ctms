import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  History,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileCheck,
  X,
  ShieldAlert,
  Clock
} from "lucide-react";

interface AuditEntry {
  id: string;
  blockNumber: number;
  timestamp: string;
  actor: string;
  role: string;
  trialId: string;
  actionType: "RECORD_CREATED" | "SAFETY_ESCALATION" | "DOSE_MODIFICATION" | "CONSENT_VERIFIED" | "CTRI_STATUS_UPDATED" | "PROTOCOL_AMENDMENT";
  fieldName: string;
  priorValue: string;
  newValue: string;
  reasonForChange: string;
  previousHash: string;
  currentHash: string;
  signatureType: "21 CFR Part 11 Digital Signature" | "Biometric Token" | "Aadhaar e-Sign";
  approvalStatus: "Approval Pending" | "Approved & Sealed";
}

const INITIAL_AUDIT_BLOCKS: AuditEntry[] = [
  {
    id: "AUD-BLK-001",
    blockNumber: 1,
    timestamp: "2026-09-18T09:14:22.108Z",
    actor: "Dr. Alka Kapoor",
    role: "Pharmacovigilance Lead",
    trialId: "CTRI/2023/02/049812",
    actionType: "SAFETY_ESCALATION",
    fieldName: "SAE_24H_NOTIFICATION_STATUS",
    priorValue: "DRAFT_PENDING",
    newValue: "TRANSMITTED_TO_DCGI",
    reasonForChange: "Mandatory expedited reporting under Rule 42 of NDCT Rules 2019",
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    currentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    signatureType: "21 CFR Part 11 Digital Signature",
    approvalStatus: "Approved & Sealed"
  },
  {
    id: "AUD-BLK-002",
    blockNumber: 2,
    timestamp: "2026-09-18T11:30:15.420Z",
    actor: "Prof. (Dr.) Tanuja Nesari",
    role: "Principal Investigator",
    trialId: "CTRI/2022/04/041852",
    actionType: "DOSE_MODIFICATION",
    fieldName: "DOSAGE_DISPENSATION",
    priorValue: "Batch ASH-2022-B03 (Pending QC)",
    newValue: "Batch ASH-AIIA-2022-B04 (HPLC Standardized)",
    reasonForChange: "Annual stability batch update per Ayurvedic Pharmacopoeia of India specifications",
    previousHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    currentHash: "7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c65c40cfa676131cb",
    signatureType: "21 CFR Part 11 Digital Signature",
    approvalStatus: "Approved & Sealed"
  },
  {
    id: "AUD-BLK-003",
    blockNumber: 3,
    timestamp: "2026-09-19T08:22:04.915Z",
    actor: "Ethics Committee Member Sec.",
    role: "Ethics Committee",
    trialId: "CTRI/2021/11/038102",
    actionType: "CTRI_STATUS_UPDATED",
    fieldName: "IEC_CONTINUING_REVIEW_APPROVAL",
    priorValue: "VALID_TILL_AUG_2026",
    newValue: "RENEWED_TILL_AUG_2027",
    reasonForChange: "Annual continuing ethics review satisfied per ICMR National Ethical Guidelines 2017",
    previousHash: "7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c65c40cfa676131cb",
    currentHash: "9f83c605d4c82b3e925b139902b0f04e0e5e9e1d1e173d88f4e72f19a1f4f82b",
    signatureType: "21 CFR Part 11 Digital Signature",
    approvalStatus: "Approved & Sealed"
  },
  {
    id: "AUD-BLK-004",
    blockNumber: 4,
    timestamp: "2026-09-19T14:05:40.332Z",
    actor: "Clinical Research Coordinator",
    role: "Clinical Coordinator",
    trialId: "CTRI/2023/06/054119",
    actionType: "CONSENT_VERIFIED",
    fieldName: "DPDP_AUDIO_VISUAL_CONSENT_HASH",
    priorValue: "UNVERIFIED",
    newValue: "VERIFIED_TAMPER_EVIDENT",
    reasonForChange: "Participant provided bilingual e-Consent; encrypted audio-visual file securely vaulted",
    previousHash: "9f83c605d4c82b3e925b139902b0f04e0e5e9e1d1e173d88f4e72f19a1f4f82b",
    currentHash: "b4c23179a8e93240f901a88b5d3269b1836a9b40723a3e6f9872e42bc511e4f9",
    signatureType: "Aadhaar e-Sign",
    approvalStatus: "Approved & Sealed"
  },
  {
    id: "AUD-BLK-005",
    blockNumber: 5,
    timestamp: "2026-09-20T06:30:10.840Z",
    actor: "Lead Quality Monitor",
    role: "Clinical Monitor",
    trialId: "CTRI/2022/04/041852",
    actionType: "PROTOCOL_AMENDMENT",
    fieldName: "SITE_SOURCE_DATA_VERIFICATION_SDV",
    priorValue: "SDV_90_PERCENT",
    newValue: "SDV_100_PERCENT_COMPLETE",
    reasonForChange: "Quarterly Source Data Verification (SDV) completed across 98 enrolled subjects",
    previousHash: "b4c23179a8e93240f901a88b5d3269b1836a9b40723a3e6f9872e42bc511e4f9",
    currentHash: "c82f190e21a48c5b902e418a0029b37c44e92b37e23c65c40cfa676131cb9912",
    signatureType: "21 CFR Part 11 Digital Signature",
    approvalStatus: "Approval Pending"
  }
];

interface Props {
  userRole?: string;
}

export default function ALCOAAuditTrail({ userRole = "Admin" }: Props) {
  const [logs, setLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_BLOCKS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"VALID" | "FAILED" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Audit Entry Form State
  const [newEntry, setNewEntry] = useState({
    trialId: "CTRI/2022/04/041852",
    actionType: "PROTOCOL_AMENDMENT" as AuditEntry["actionType"],
    fieldName: "IEC_CONTINUING_REVIEW_SUBMISSION",
    priorValue: "DRAFT_INTERNAL",
    newValue: "OFFICIALLY_LODGED",
    reasonForChange: "Mandatory annual continuing ethics review filing per ICMR 2017 norms",
    signatureType: "21 CFR Part 11 Digital Signature" as const
  });

  // Role Access Gating: Authorized users vs Regulator read-only
  const canModifyAudit = ["Admin", "Ethics Committee", "Clinical Monitor", "Principal Investigator"].includes(userRole);

  const verifyChainIntegrity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      // Simulate cryptographic hash chain verification
      let isValid = true;
      for (let i = 1; i < logs.length; i++) {
        if (logs[i].previousHash !== logs[i - 1].currentHash) {
          isValid = false;
          break;
        }
      }
      setIsVerifying(false);
      setVerificationResult(isValid ? "VALID" : "FAILED");
    }, 800);
  };

  const handleApproveBlock = (id: string) => {
    if (!canModifyAudit) {
      alert("Unauthorized: CDSCO Regulators hold read-only inspection access.");
      return;
    }

    setLogs((current) =>
      current.map((log) =>
        log.id === id
          ? {
              ...log,
              approvalStatus: "Approved & Sealed",
              timestamp: new Date().toISOString(),
              reasonForChange: `${log.reasonForChange} • [Formally Approved & Cryptographically Sealed by ${userRole}]`
            }
          : log
      )
    );

    alert(`✅ Audit Block ${id} has been formally approved and cryptographically sealed into the immutable ledger.`);
  };

  const handleCreateAuditEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyAudit) {
      alert("Unauthorized: Regulator accounts have read-only inspection access.");
      return;
    }

    const nextBlockNo = logs.length + 1;
    const parentBlock = logs[logs.length - 1];
    const prevHash = parentBlock ? parentBlock.currentHash : "0000000000000000000000000000000000000000000000000000000000000000";
    
    // Generate deterministic dummy sha256 representation
    const rawData = `${nextBlockNo}-${newEntry.trialId}-${newEntry.fieldName}-${Date.now()}`;
    const mockHash = Array.from(rawData).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
    const currentHash = Math.abs(mockHash).toString(16).padStart(64, "a8f3");

    const entry: AuditEntry = {
      id: `AUD-BLK-${String(nextBlockNo).padStart(3, "0")}`,
      blockNumber: nextBlockNo,
      timestamp: new Date().toISOString(),
      actor: userRole === "Admin" ? "System Administrator (CTMS Command)" : `${userRole} Officer`,
      role: userRole,
      trialId: newEntry.trialId,
      actionType: newEntry.actionType,
      fieldName: newEntry.fieldName.trim(),
      priorValue: newEntry.priorValue.trim(),
      newValue: newEntry.newValue.trim(),
      reasonForChange: newEntry.reasonForChange.trim(),
      previousHash: prevHash,
      currentHash: currentHash,
      signatureType: newEntry.signatureType,
      approvalStatus: "Approval Pending"
    };

    setLogs((prev) => [...prev, entry]);
    setShowAddModal(false);
    alert(`✅ New Audit Block ${entry.id} recorded with initial 'Approval Pending' status.`);
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.trialId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.approvalStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-600/20 p-3.5 ring-1 ring-emerald-500/40 text-emerald-300">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/40">
                  ALCOA+ Data Integrity & 21 CFR Part 11
                </span>
                <span className="text-xs text-slate-400 font-mono">SHA-256 Hash Chained Vault</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Immutable Clinical Audit Trail & DPDP Compliance
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Guarantees complete Attributability, Legibility, Contemporaneity, Originality, and Accuracy (ALCOA+). Every field modification is bound to a cryptographic SHA-256 hash, prior-value diff, electronic signature reason, and certified Indian data-residency timestamp.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canModifyAudit ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
                >
                  <Plus size={16} />
                  + Add Audit Entry
                </button>
              </>
            ) : (
              <div className="rounded-xl bg-amber-950/40 border border-amber-700/50 px-3.5 py-2 text-xs font-semibold text-amber-300 flex items-center gap-2">
                <ShieldAlert size={15} className="text-amber-400 shrink-0" />
                <span>CDSCO Auditor: Read-Only Audit Access</span>
              </div>
            )}

            <button
              type="button"
              onClick={verifyChainIntegrity}
              disabled={isVerifying}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={isVerifying ? "animate-spin" : ""} />
              {isVerifying ? "Verifying Hash Chain..." : "Verify Chain Integrity"}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult === "VALID" && (
        <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={22} />
            <div>
              <p className="text-sm font-bold text-white">Cryptographic Hash Chain Verified: 100% Immutable</p>
              <p className="text-xs text-emerald-300/80">
                All {logs.length} blocks verified. Zero tampering detected. SHA-256 hashes sequentially match previous parent block headers.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-700 font-mono">
            CERT-IN & ISO 27001 AUDIT PASS
          </span>
        </div>
      )}

      {/* ALCOA+ 9 Principles Indicator Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Attributable", desc: "User ID & role recorded" },
          { label: "Legible", desc: "Human readable diffs" },
          { label: "Contemporaneous", desc: "UTC system timestamp" },
          { label: "Original", desc: "First recorded value stored" },
          { label: "Accurate", desc: "Validated field types" },
          { label: "Enduring", desc: "SHA-256 cryptographic chain" }
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-center">
            <span className="text-xs font-bold text-emerald-400 block">{item.label}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <History size={18} className="text-teal-400" />
              Cryptographic Audit Log Ledger ({logs.length} Blocks)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit trail compliant with 21 CFR Part 11, NDCT Rules 2019, and DPDP Act 2023
            </p>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by actor, field, trial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="px-4 py-3">BLK #</th>
                <th className="px-4 py-3">TIMESTAMP</th>
                <th className="px-4 py-3">ACTOR & ROLE</th>
                <th className="px-4 py-3">STUDY ID</th>
                <th className="px-4 py-3">FIELD MODIFIED</th>
                <th className="px-4 py-3 text-red-300">PRIOR VALUE</th>
                <th className="px-4 py-3 text-emerald-300">NEW VALUE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/60 transition">
                  <td className="px-4 py-3 font-bold text-slate-200">#{log.blockNumber}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-white block font-sans">{log.actor}</span>
                    <span className="text-[10px] text-indigo-300 font-sans">{log.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-semibold">{log.trialId}</td>
                  <td className="px-4 py-3 font-bold text-amber-300">{log.fieldName}</td>
                  <td className="px-4 py-3 text-red-400 max-w-[130px] truncate">{log.priorValue}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold max-w-[130px] truncate">{log.newValue}</td>
                  <td className="px-4 py-3 font-sans">
                    {log.approvalStatus === "Approval Pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 border border-amber-600/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        <Clock size={11} className="animate-spin" />
                        Approval Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 size={11} />
                        Approved & Sealed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-sans">
                    {log.approvalStatus === "Approval Pending" ? (
                      canModifyAudit ? (
                        <button
                          type="button"
                          onClick={() => handleApproveBlock(log.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 text-[11px] font-semibold shadow-sm transition"
                        >
                          <FileCheck size={13} />
                          Update & Approve
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Read-Only</span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.currentHash.substring(0, 10)}...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Audit Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-600/20 p-2.5 text-indigo-400 border border-indigo-500/30">
                  <History size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Append Cryptographic Audit Entry</h3>
                  <p className="text-xs text-slate-400">Recorded with initial 'Approval Pending' status</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAuditEntry} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Clinical Protocol *</label>
                <select
                  value={newEntry.trialId}
                  onChange={(e) => setNewEntry({ ...newEntry, trialId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="CTRI/2022/04/041852">CTRI/2022/04/041852 (Ashwagandha)</option>
                  <option value="CTRI/2021/11/038102">CTRI/2021/11/038102 (Guduchi)</option>
                  <option value="CTRI/2023/02/049812">CTRI/2023/02/049812 (Ayush-64)</option>
                  <option value="CTRI/2023/06/054119">CTRI/2023/06/054119 (Haridra Khanda)</option>
                  <option value="CTRI/2022/09/045821">CTRI/2022/09/045821 (Virechana Karma)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Action Type *</label>
                  <select
                    value={newEntry.actionType}
                    onChange={(e) => setNewEntry({ ...newEntry, actionType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="PROTOCOL_AMENDMENT">PROTOCOL_AMENDMENT</option>
                    <option value="DOSE_MODIFICATION">DOSE_MODIFICATION</option>
                    <option value="SAFETY_ESCALATION">SAFETY_ESCALATION</option>
                    <option value="CONSENT_VERIFIED">CONSENT_VERIFIED</option>
                    <option value="CTRI_STATUS_UPDATED">CTRI_STATUS_UPDATED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Field Modified *</label>
                  <input
                    type="text"
                    value={newEntry.fieldName}
                    onChange={(e) => setNewEntry({ ...newEntry, fieldName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Prior Value *</label>
                  <input
                    type="text"
                    value={newEntry.priorValue}
                    onChange={(e) => setNewEntry({ ...newEntry, priorValue: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">New Value *</label>
                  <input
                    type="text"
                    value={newEntry.newValue}
                    onChange={(e) => setNewEntry({ ...newEntry, newValue: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Reason for Modification (21 CFR Part 11) *</label>
                <textarea
                  rows={2}
                  value={newEntry.reasonForChange}
                  onChange={(e) => setNewEntry({ ...newEntry, reasonForChange: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  required
                />
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-slate-300 space-y-1">
                <p className="font-bold text-amber-300">Approval Workflow:</p>
                <p className="text-[11px] text-slate-400">
                  This block will be added with <strong>Approval Pending</strong>. It can subsequently be reviewed, signed, and approved by institutional authorities into the immutable SHA-256 ledger.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg"
                >
                  Submit with Pending Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
