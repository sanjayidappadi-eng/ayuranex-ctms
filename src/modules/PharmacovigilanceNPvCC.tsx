import { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Send,
  FileCheck,
  CheckCircle2,
  Activity,
  Flame,
  Search,
  Plus,
  X
} from "lucide-react";
import type { PharmacovigilanceEvent } from "../data/clinicalDataset";
import {
  PHARMACOVIGILANCE_RECORDS,
  OFFICIAL_AIIA_TRIALS,
  CDISC_SDTM_SUBJECTS
} from "../data/clinicalDataset";
import { dispatch24hRegulatoryAlert } from "../services/regulatoryAlerts";

interface Props {
  userRole?: string;
}

export default function PharmacovigilanceNPvCC({ userRole: _userRole }: Props) {
  const [events, setEvents] = useState<PharmacovigilanceEvent[]>(PHARMACOVIGILANCE_RECORDS);
  const [selectedEvent, setSelectedEvent] = useState<PharmacovigilanceEvent | null>(events[0]);
  const [showCausalityModal, setShowCausalityModal] = useState(false);
  const [showAddAdverseModal, setShowAddAdverseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "AE" | "ADR" | "SAE">("ALL");

  const [newAdverse, setNewAdverse] = useState<{
    trialId: string;
    usubjid: string;
    eventType: "AE" | "ADR" | "SAE";
    meddraPt: string;
    meddraSoc: string;
    verbatimTerm: string;
    severity: "Mild" | "Moderate" | "Severe" | "Life-threatening";
    suspectedDrug: string;
    onsetDate: string;
    causalityCategory: "Certain" | "Probable" | "Possible" | "Unlikely" | "Unclassifiable";
    seriousnessCriteria: "Hospitalization / Prolonged" | "Life-threatening" | "Disability" | "Congenital Anomaly" | "Medically Significant";
    actionTaken: string;
    outcome: "Recovered completely" | "Recovering" | "Ongoing" | "Recovered with sequelae" | "Fatal";
  }>({
    trialId: OFFICIAL_AIIA_TRIALS[0].trialId,
    usubjid: "",
    eventType: "ADR",
    meddraPt: "",
    meddraSoc: "Gastrointestinal disorders",
    verbatimTerm: "",
    severity: "Moderate",
    suspectedDrug: "",
    onsetDate: new Date().toISOString().slice(0, 10),
    causalityCategory: "Probable",
    seriousnessCriteria: "Hospitalization / Prolonged",
    actionTaken: "Study formulation temporarily withheld; antacid administered",
    outcome: "Recovering"
  });

  // Live countdown calculation for 24-hour regulatory reporting clock
  const [timeRemaining24h, setTimeRemaining24h] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 15,
    minutes: 42,
    seconds: 18,
    isExpired: false
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!selectedEvent || !selectedEvent.isSerious) return;
      const targetTime = new Date(selectedEvent.notificationDue24h).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeRemaining24h({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining24h({ hours, minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedEvent]);

  // Naranjo Causality Assessment State
  const [naranjoAnswers, setNaranjoAnswers] = useState<Record<number, number>>({
    1: 1, // Previous conclusive reports? (+1)
    2: 2, // Did adverse event appear after suspected drug? (+2)
    3: 1, // Did adverse reaction improve when drug discontinued? (+1)
    4: 0, // Did reaction reappear when drug re-administered? (0 not done)
    5: -1, // Alternative causes? (-1)
    6: 0, // Placebo response? (0)
    7: 1, // Toxic concentration detected? (+1)
    8: 0, // Dose-dependent severity? (0)
    9: 1, // Previous similar reaction to similar substance? (+1)
    10: 1 // Confirmed by objective evidence? (+1)
  });

  const calculateNaranjoScore = () => {
    const total = Object.values(naranjoAnswers).reduce((acc, val) => acc + val, 0);
    let category = "Unlikely";
    if (total >= 9) category = "Certain / Definite";
    else if (total >= 5) category = "Probable";
    else if (total >= 1) category = "Possible";
    return { score: total, category };
  };

  const handleNotifyDCGI = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.eventId === id ? { ...e, dcgiNotificationStatus: "Submitted within 24h" } : e
      )
    );
    if (selectedEvent && selectedEvent.eventId === id) {
      setSelectedEvent((prev) =>
        prev ? { ...prev, dcgiNotificationStatus: "Submitted within 24h" } : null
      );
      dispatch24hRegulatoryAlert({
        id: selectedEvent.eventId,
        patientId: selectedEvent.usubjid,
        trialId: selectedEvent.ctriNumber,
        trialName: selectedEvent.trialShortTitle || "AIIA Clinical Trial",
        eventDescription: `${selectedEvent.meddraPt} (${selectedEvent.meddraSoc})`,
        severity: selectedEvent.severity,
        dateReported: selectedEvent.reportedDate
      });
    }
    alert("✅ Preliminary 24-Hour Expedited SAE Notification electronically transmitted to CDSCO / DCGI Portal, IEC, and emergency handsets via SMS & Email.");
  };

  const handleCreateAdverseEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdverse.meddraPt.trim() || !newAdverse.usubjid) {
      alert("Please select a Patient and enter MedDRA Preferred Term (adverse event).");
      return;
    }

    const trialObj = OFFICIAL_AIIA_TRIALS.find((t) => t.trialId === newAdverse.trialId) || OFFICIAL_AIIA_TRIALS[0];
    const subjectObj = CDISC_SDTM_SUBJECTS.find((s) => s.usubjid === newAdverse.usubjid);
    const isSerious = newAdverse.eventType === "SAE" || newAdverse.severity === "Severe" || newAdverse.severity === "Life-threatening";

    const newEvt: PharmacovigilanceEvent = {
      eventId: `NPVCC-2026-${newAdverse.eventType}-${String(Date.now()).slice(-4)}`,
      trialId: trialObj.trialId,
      ctriNumber: trialObj.ctriNumber,
      trialShortTitle: trialObj.shortTitle,
      studyTitle: trialObj.studyTitle,
      usubjid: newAdverse.usubjid,
      patientAge: subjectObj?.age || 42,
      patientSex: subjectObj?.sex || "F",
      eventType: newAdverse.eventType,
      meddraSoc: newAdverse.meddraSoc,
      meddraPt: newAdverse.meddraPt.trim(),
      meddraLlt: newAdverse.verbatimTerm.trim() || newAdverse.meddraPt.trim(),
      verbatimTerm: newAdverse.verbatimTerm.trim() || newAdverse.meddraPt.trim(),
      severity: newAdverse.severity,
      onsetDate: `${newAdverse.onsetDate}T10:00:00Z`,
      reportedDate: new Date().toISOString(),
      suspectedDrug: newAdverse.suspectedDrug.trim() || trialObj.interventionName || "Investigational Herbal Drug",
      formulationType: trialObj.interventionFormulation || "Ayurvedic extract",
      batchNumber: trialObj.batchNumber || "AYU-BATCH-2026",
      dailyDose: "Standardized Trial Protocol Dose",
      route: "Oral",
      causalityScore: newAdverse.causalityCategory === "Probable" ? 6 : newAdverse.causalityCategory === "Certain" ? 9 : 3,
      causalityCategory: newAdverse.causalityCategory,
      isSerious,
      seriousnessCriteria: isSerious ? newAdverse.seriousnessCriteria : undefined,
      notificationDue24h: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      detailedReportDue14d: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      dcgiNotificationStatus: isSerious ? "Pending Submission" : "Submitted within 24h",
      iecNotificationStatus: "Under Committee Review",
      sponsorNotificationStatus: "Notified",
      dsmbEscalated: isSerious,
      actionTaken: newAdverse.actionTaken,
      outcome: newAdverse.outcome,
      assignedOfficer: "Dr. Alka Kapoor (NPvCC Lead)"
    };

    if (isSerious) {
      dispatch24hRegulatoryAlert({
        id: newEvt.eventId,
        patientId: newEvt.usubjid,
        trialId: newEvt.ctriNumber,
        trialName: newEvt.trialShortTitle || "AIIA Clinical Trial",
        eventDescription: `${newEvt.meddraPt} (${newEvt.meddraSoc})`,
        severity: newEvt.severity,
        dateReported: newEvt.reportedDate
      });
    }

    setEvents((prev) => [newEvt, ...prev]);
    setSelectedEvent(newEvt);
    setShowAddAdverseModal(false);
    alert(`✅ Adverse event ${newEvt.eventId} recorded successfully for patient ${newEvt.usubjid} in study ${newEvt.ctriNumber}!${isSerious ? " Mandatory 24-hour regulatory countdown clock activated and DCGI/IEC alerts dispatched." : ""}`);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.suspectedDrug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.meddraPt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.usubjid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || e.eventType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: AIIA National Pharmacovigilance Coordination Centre mandate */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/50 via-slate-900 to-indigo-950/40 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-red-600/20 p-3.5 ring-1 ring-red-500/40 text-red-400">
              <ShieldAlert size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-red-300 border border-red-500/40">
                  National Coordination Centre (NPvCC)
                </span>
                <span className="text-xs text-slate-400 font-mono">NDCT Rules 2019 / GCP-ASU</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                AIIA Pharmacovigilance & Safety Surveillance Center
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                National surveillance hub for ASU&H clinical trials. Monitoring Adverse Drug Reactions (ADR), Serious Adverse Events (SAE), MedDRA terminology mapping, and automated regulatory 24-hour expedited countdown clocks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const trial = OFFICIAL_AIIA_TRIALS[0];
                const trialSubjects = CDISC_SDTM_SUBJECTS.filter((s) => s.studyId === trial.trialId);
                setNewAdverse({
                  trialId: trial.trialId,
                  usubjid: trialSubjects[0]?.usubjid || "",
                  eventType: "ADR",
                  meddraPt: "",
                  meddraSoc: "Gastrointestinal disorders",
                  verbatimTerm: "",
                  severity: "Moderate",
                  suspectedDrug: trial.interventionName,
                  onsetDate: new Date().toISOString().slice(0, 10),
                  causalityCategory: "Probable",
                  seriousnessCriteria: "Hospitalization / Prolonged",
                  actionTaken: "Study formulation temporarily withheld; antacid administered",
                  outcome: "Recovering"
                });
                setShowAddAdverseModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-red-500 transition cursor-pointer"
            >
              <Plus size={17} />
              + Report Adverse Event / ADR
            </button>
            <button
              onClick={() => setShowCausalityModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
            >
              <Activity size={17} />
              WHO-UMC / Naranjo Calculator
            </button>
          </div>
        </div>
      </div>

      {/* 24-Hour Regulatory Clock Callout (Crucial for NDCT Rules 2019 Compliance) */}
      {selectedEvent && selectedEvent.isSerious && (
        <div className="rounded-2xl border-2 border-red-500/60 bg-red-950/40 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 text-red-500 pointer-events-none">
            <Flame size={200} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-bold text-red-300 text-sm tracking-wide uppercase">
                  MANDATORY 24-HOUR REGULATORY REPORTING CLOCK (NDCT RULES 2019)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Serious Adverse Event: {selectedEvent.meddraPt} ({selectedEvent.eventId})
              </h2>
              <p className="text-sm text-slate-300">
                Subject: <span className="text-teal-300 font-mono font-semibold">{selectedEvent.usubjid}</span> • Suspected Formulation: <span className="text-amber-300 font-semibold">{selectedEvent.suspectedDrug}</span>
              </p>
              <p className="text-xs text-slate-400">
                Rule 42, New Drugs and Clinical Trials Rules, 2019 requires preliminary notification to the Licensing Authority (DCGI) & Ethics Committee within 24 hours of investigator awareness.
              </p>
            </div>

            {/* Countdown Display */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 rounded-2xl border border-red-800/80 p-5 shadow-inner">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase text-slate-400">Time to Mandatory Filing</p>
                <div className="mt-1 flex items-baseline gap-2 font-mono text-3xl font-black text-red-400">
                  <span>{String(timeRemaining24h.hours).padStart(2, "0")}h</span>
                  <span>:</span>
                  <span>{String(timeRemaining24h.minutes).padStart(2, "0")}m</span>
                  <span>:</span>
                  <span>{String(timeRemaining24h.seconds).padStart(2, "0")}s</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Due: {new Date(selectedEvent.notificationDue24h).toLocaleTimeString()} IST</p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 flex flex-col gap-2">
                {selectedEvent.dcgiNotificationStatus === "Pending Submission" ? (
                  <button
                    onClick={() => handleNotifyDCGI(selectedEvent.eventId)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-red-500 transition cursor-pointer"
                  >
                    <Send size={16} />
                    Submit 24h Notification to DCGI
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-700 px-4 py-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 size={16} />
                    DCGI Preliminary Notified
                  </div>
                )}
                <span className="text-[11px] text-center text-slate-400">
                  14-Day Detailed Report Due: {new Date(selectedEvent.detailedReportDue14d).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Safety Records List + Detailed Signal Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Events Filter & List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Activity size={18} className="text-teal-400" />
                Active Safety Registry
              </h3>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
                {filteredEvents.length} Events
              </span>
            </div>

            {/* Search & Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by MedDRA term, ID, drug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-950/70 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="flex gap-2">
                {(["ALL", "SAE", "ADR", "AE"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      filterType === t
                        ? t === "SAE"
                          ? "bg-red-950/80 border-red-600 text-red-300"
                          : t === "ADR"
                          ? "bg-orange-950/80 border-orange-600 text-orange-300"
                          : "bg-teal-950/80 border-teal-600 text-teal-300"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="mt-4 space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredEvents.map((event) => {
                const isSelected = selectedEvent?.eventId === event.eventId;
                return (
                  <div
                    key={event.eventId}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-teal-400/80 bg-slate-800 shadow-md ring-1 ring-teal-400/30"
                        : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            event.eventType === "SAE"
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : event.eventType === "ADR"
                              ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {event.eventType}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300">{event.eventId}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(event.reportedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-2">
                      <p className="font-bold text-white text-sm">{event.meddraPt}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{event.verbatimTerm}</p>
                    </div>

                    <div className="mt-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 p-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Affected Patient:</span>
                        <span className="font-mono font-bold text-teal-300">{event.usubjid}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800/60">
                        <span className="text-slate-500 block text-[11px]">Clinical Trial:</span>
                        <p className="font-semibold text-slate-200 line-clamp-1 mt-0.5" title={event.trialShortTitle || event.studyTitle}>
                          {event.trialShortTitle || event.studyTitle || "AIIA Clinical Trial"}
                        </p>
                        <p className="font-mono text-[10px] text-indigo-300 mt-0.5">
                          {event.ctriNumber}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                      <span className="text-slate-400">
                        Drug: <span className="text-amber-300 font-medium">{event.suspectedDrug.split(" ")[0]}</span>
                      </span>
                      <span
                        className={`font-semibold ${
                          event.causalityCategory === "Probable" || event.causalityCategory === "Certain"
                            ? "text-red-400"
                            : "text-slate-400"
                        }`}
                      >
                        Causality: {event.causalityCategory}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: In-Depth Clinical & Regulatory Dossier (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedEvent ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{selectedEvent.meddraPt}</h2>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                        selectedEvent.severity === "Severe"
                          ? "bg-red-950 border-red-700 text-red-300"
                          : "bg-amber-950 border-amber-700 text-amber-300"
                      }`}
                    >
                      {selectedEvent.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    System Organ Class: <span className="text-teal-300 font-semibold">{selectedEvent.meddraSoc}</span>
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <p className="text-xs font-semibold text-slate-300 max-w-[240px] truncate" title={selectedEvent.trialShortTitle || selectedEvent.studyTitle}>
                    {selectedEvent.trialShortTitle || "AIIA Clinical Trial"}
                  </p>
                  <p className="font-mono text-[11px] text-indigo-300 mt-0.5">{selectedEvent.ctriNumber}</p>
                </div>
              </div>

              {/* Associated Clinical Trial & Affected Patient Banner */}
              <div className="rounded-xl border border-indigo-700/50 bg-indigo-950/40 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      Associated Clinical Trial
                    </span>
                    <p className="text-sm font-bold text-white mt-1">
                      {selectedEvent.trialShortTitle || selectedEvent.studyTitle || "AIIA Clinical Trial"}
                    </p>
                    <p className="font-mono text-xs text-indigo-300 mt-0.5">
                      CTRI Registration: {selectedEvent.ctriNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      Affected Patient / Clinical Subject
                    </span>
                    <p className="text-sm font-mono font-bold text-teal-300 mt-1">
                      {selectedEvent.usubjid}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {selectedEvent.patientAge ? `${selectedEvent.patientAge} Years • ${selectedEvent.patientSex === "M" ? "Male" : "Female"}` : "Enrolled Trial Subject"} • CDISC SDTM Subject Record
                    </p>
                  </div>
                </div>
              </div>

              {/* MedDRA & ASU Terminology Coding Panel */}
              <div className="rounded-xl border border-teal-800/40 bg-teal-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <FileCheck size={14} />
                    MedDRA Dictionary v26.0 & ASU Standardization
                  </h4>
                  <span className="text-[11px] text-teal-400/80 font-mono">CDISC / ICH E2B Coded</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                    <span className="text-slate-500 block">System Organ Class (SOC)</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedEvent.meddraSoc}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                    <span className="text-slate-500 block">Preferred Term (PT)</span>
                    <span className="font-semibold text-teal-300 mt-0.5 block">{selectedEvent.meddraPt}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800">
                    <span className="text-slate-500 block">Investigator Verbatim</span>
                    <span className="font-semibold text-slate-300 mt-0.5 block italic">{selectedEvent.verbatimTerm}</span>
                  </div>
                </div>
              </div>

              {/* Drug Formulation & Batch Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspected ASU Formulation</h4>
                  <p className="text-base font-bold text-amber-300">{selectedEvent.suspectedDrug}</p>
                  <p className="text-xs text-slate-400">Type: {selectedEvent.formulationType}</p>
                  <p className="text-xs text-slate-400">Dose & Route: {selectedEvent.dailyDose} ({selectedEvent.route})</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Batch / Lot Number:</span>
                    <span className="font-mono font-bold text-slate-200">{selectedEvent.batchNumber}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Causality & Outcome</h4>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-white">{selectedEvent.causalityCategory}</span>
                    <span className="text-xs text-slate-400">(Naranjo Score: {selectedEvent.causalityScore}/12)</span>
                  </div>
                  <p className="text-xs text-slate-400">Clinical Outcome: <span className="text-emerald-300 font-semibold">{selectedEvent.outcome}</span></p>
                  <p className="text-xs text-slate-400">Assigned Safety Officer: <span className="text-indigo-300 font-semibold">{selectedEvent.assignedOfficer}</span></p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">DSMB Escalated:</span>
                    <span className={selectedEvent.dsmbEscalated ? "text-red-400 font-bold" : "text-slate-400"}>
                      {selectedEvent.dsmbEscalated ? "Yes (Safety Flagged)" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Taken */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Immediate Corrective & Clinical Action</h4>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedEvent.actionTaken}</p>
              </div>

              {/* Regulatory Milestones Check-matrix */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Regulatory Compliance Checklist (NDCT Rules 2019 / GCP-ASU)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    {selectedEvent.dcgiNotificationStatus.includes("Submitted") ? (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-white">DCGI / CDSCO 24h</p>
                      <p className="text-[11px] text-slate-400">{selectedEvent.dcgiNotificationStatus}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Ethics Committee</p>
                      <p className="text-[11px] text-slate-400">{selectedEvent.iecNotificationStatus}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Sponsor / AIIA Apex</p>
                      <p className="text-[11px] text-slate-400">{selectedEvent.sponsorNotificationStatus}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
              <ShieldAlert className="mx-auto text-slate-600 mb-3" size={48} />
              <h3 className="text-lg font-bold text-slate-300">Select an adverse event to view safety dossier</h3>
            </div>
          )}
        </div>
      </div>

      {/* Causality Assessment Modal (Naranjo Algorithm) */}
      {showCausalityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-indigo-700/60 bg-slate-950 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900">
              <div className="flex items-center gap-2.5">
                <Activity className="text-indigo-400" size={20} />
                <h3 className="font-bold text-white text-lg">WHO-UMC & Naranjo Adverse Drug Reaction Probability Scale</h3>
              </div>
              <button
                onClick={() => setShowCausalityModal(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-400">
                Standardized algorithm used by AIIA National Pharmacovigilance Coordination Centre to assess causal relationship between Ayurvedic interventions and adverse clinical events.
              </p>

              <div className="space-y-3">
                {[
                  { id: 1, q: "1. Are there previous conclusive reports on this reaction with the ASU drug?", yes: 1, no: 0, na: 0 },
                  { id: 2, q: "2. Did the adverse event appear after the suspected drug was administered?", yes: 2, no: -1, na: 0 },
                  { id: 3, q: "3. Did the adverse reaction improve when the drug was discontinued or specific antagonist given?", yes: 1, no: 0, na: 0 },
                  { id: 4, q: "4. Did the adverse reaction reappear when the drug was readministered?", yes: 2, no: -1, na: 0 },
                  { id: 5, q: "5. Are there alternative causes (other than the drug) that could on their own have caused the reaction?", yes: -1, no: 2, na: 0 },
                  { id: 6, q: "6. Did the reaction appear when a placebo was given?", yes: -1, no: 1, na: 0 },
                  { id: 7, q: "7. Was the drug detected in blood (or other fluids) in concentrations known to be toxic?", yes: 1, no: 0, na: 0 },
                  { id: 8, q: "8. Was the reaction more severe when the dose was increased, or less severe when decreased?", yes: 1, no: 0, na: 0 },
                  { id: 9, q: "9. Did the patient have a similar reaction to the same or similar drugs in any previous exposure?", yes: 1, no: 0, na: 0 },
                  { id: 10, q: "10. Was the adverse event confirmed by any objective evidence?", yes: 1, no: 0, na: 0 }
                ].map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-200 font-medium max-w-md">{item.q}</span>
                    <div className="flex gap-1.5 shrink-0">
                      {[
                        { label: "Yes", val: item.yes },
                        { label: "No", val: item.no },
                        { label: "Do not know", val: item.na }
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setNaranjoAnswers((prev) => ({ ...prev, [item.id]: opt.val }))}
                          className={`px-3 py-1 rounded-lg font-semibold border transition ${
                            naranjoAnswers[item.id] === opt.val
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "border-slate-700 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculated Result */}
              {(() => {
                const res = calculateNaranjoScore();
                return (
                  <div className="rounded-xl border border-indigo-700/60 bg-indigo-950/40 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-300 font-semibold uppercase">Total Causality Score</p>
                      <p className="text-2xl font-black text-white mt-0.5">{res.score} Points</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-indigo-300 font-semibold uppercase">Causality Categorization</p>
                      <p className="text-xl font-bold text-teal-300 mt-0.5">{res.category}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={() => setShowCausalityModal(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Apply Assessment to Active Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Adverse Event / ADR Entry Modal */}
      {showAddAdverseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-600/20 p-2.5 text-red-400 border border-red-500/30">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Record Clinical Adverse Event / ADR</h3>
                  <p className="text-xs text-slate-400">NPvCC Surveillance Portal • Aligned with NDCT Rules 2019 & MedDRA</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdverseModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAdverseEvent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Clinical Trial Protocol *</label>
                  <select
                    value={newAdverse.trialId}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const subjects = CDISC_SDTM_SUBJECTS.filter((s) => s.studyId === tId);
                      const trial = OFFICIAL_AIIA_TRIALS.find((t) => t.trialId === tId);
                      setNewAdverse({
                        ...newAdverse,
                        trialId: tId,
                        usubjid: subjects[0]?.usubjid || "",
                        suspectedDrug: trial?.interventionName || ""
                      });
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    {OFFICIAL_AIIA_TRIALS.map((t) => (
                      <option key={t.trialId} value={t.trialId}>
                        {t.ctriNumber} — {t.shortTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Trial Patient / USUBJID *</label>
                  <select
                    value={newAdverse.usubjid}
                    onChange={(e) => setNewAdverse({ ...newAdverse, usubjid: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    {CDISC_SDTM_SUBJECTS.filter((s) => s.studyId === newAdverse.trialId).map((s) => (
                      <option key={s.usubjid} value={s.usubjid}>
                        {s.usubjid} ({s.age}y {s.sex} • {s.actarm})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Event Classification *</label>
                  <select
                    value={newAdverse.eventType}
                    onChange={(e) => setNewAdverse({ ...newAdverse, eventType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="ADR">ADR (Adverse Drug Reaction)</option>
                    <option value="AE">AE (Adverse Event)</option>
                    <option value="SAE">SAE (Serious Adverse Event)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Clinical Severity *</label>
                  <select
                    value={newAdverse.severity}
                    onChange={(e) => setNewAdverse({ ...newAdverse, severity: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="Mild">Mild (Grade 1)</option>
                    <option value="Moderate">Moderate (Grade 2)</option>
                    <option value="Severe">Severe (Grade 3)</option>
                    <option value="Life-threatening">Life-threatening (Grade 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Onset Date *</label>
                  <input
                    type="date"
                    value={newAdverse.onsetDate}
                    onChange={(e) => setNewAdverse({ ...newAdverse, onsetDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">MedDRA System Organ Class (SOC) *</label>
                  <select
                    value={newAdverse.meddraSoc}
                    onChange={(e) => setNewAdverse({ ...newAdverse, meddraSoc: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="Gastrointestinal disorders">Gastrointestinal disorders</option>
                    <option value="Immune system disorders">Immune system disorders</option>
                    <option value="Skin and subcutaneous tissue disorders">Skin and subcutaneous tissue disorders</option>
                    <option value="Hepatobiliary disorders">Hepatobiliary disorders</option>
                    <option value="Nervous system disorders">Nervous system disorders</option>
                    <option value="General disorders and administration site conditions">General disorders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">MedDRA Preferred Term (PT) *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pyrosis (Heartburn), Urticaria, Headache"
                    value={newAdverse.meddraPt}
                    onChange={(e) => setNewAdverse({ ...newAdverse, meddraPt: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Verbatim Event Description (Patient Report) *</label>
                <textarea
                  rows={2}
                  placeholder="Describe patient reported symptoms, time after herbal ingestion, and clinical trajectory..."
                  value={newAdverse.verbatimTerm}
                  onChange={(e) => setNewAdverse({ ...newAdverse, verbatimTerm: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Suspected Ayurvedic Formulation *</label>
                  <input
                    type="text"
                    value={newAdverse.suspectedDrug}
                    onChange={(e) => setNewAdverse({ ...newAdverse, suspectedDrug: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">WHO-UMC Causality Assessment *</label>
                  <select
                    value={newAdverse.causalityCategory}
                    onChange={(e) => setNewAdverse({ ...newAdverse, causalityCategory: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="Certain">Certain / Definite</option>
                    <option value="Probable">Probable</option>
                    <option value="Possible">Possible</option>
                    <option value="Unlikely">Unlikely</option>
                  </select>
                </div>
              </div>

              {newAdverse.eventType === "SAE" && (
                <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/30 space-y-2">
                  <div className="flex items-center gap-2 text-red-300 font-bold">
                    <Flame size={16} />
                    <span>Mandatory Serious Adverse Event (SAE) Criteria:</span>
                  </div>
                  <select
                    value={newAdverse.seriousnessCriteria}
                    onChange={(e) => setNewAdverse({ ...newAdverse, seriousnessCriteria: e.target.value as any })}
                    className="w-full rounded-xl border border-red-700/60 bg-slate-950 px-3 py-2 text-slate-200 text-xs"
                  >
                    <option value="Hospitalization / Prolonged">Requires Inpatient Hospitalization or Prolongation</option>
                    <option value="Life-threatening">Life-threatening Experience</option>
                    <option value="Disability">Persistent or Significant Disability / Incapacity</option>
                    <option value="Congenital Anomaly">Congenital Anomaly / Birth Defect</option>
                    <option value="Medically Significant">Medically Significant Event</option>
                  </select>
                  <p className="text-[11px] text-red-300/80">
                    ⚠️ Submission will initiate the compulsory 24-hour countdown clock under Rule 42 of NDCT Rules 2019 for electronic notification to DCGI.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Action Taken with Study Formulation</label>
                  <input
                    type="text"
                    value={newAdverse.actionTaken}
                    onChange={(e) => setNewAdverse({ ...newAdverse, actionTaken: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Event Outcome</label>
                  <select
                    value={newAdverse.outcome}
                    onChange={(e) => setNewAdverse({ ...newAdverse, outcome: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                  >
                    <option value="Recovering">Recovering / Resolving</option>
                    <option value="Recovered completely">Recovered / Resolved Completely</option>
                    <option value="Ongoing">Ongoing / Not Recovered</option>
                    <option value="Recovered with sequelae">Recovered with Sequelae</option>
                    <option value="Fatal">Fatal</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdverseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg flex items-center gap-2"
                >
                  <ShieldAlert size={16} />
                  Submit Adverse Event to NPvCC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
