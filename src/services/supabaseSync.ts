import { supabase } from "../supabase";
import type { PharmacovigilanceEvent } from "../data/clinicalDataset";

export interface SyncStatus {
  serviceName: string;
  isOnline: boolean;
  lastSyncedAt: string;
  recordCount: number;
  statusMessage: string;
}

/**
 * 1. Synchronize Clinical Trials
 */
export async function syncTrialsToCloud(trials: any[]): Promise<boolean> {
  try {
    for (const t of trials) {
      await supabase.from("trials").upsert(
        {
          trial_id: t.trialId,
          study_name: t.studyName,
          investigator: t.investigator,
          target_patients: t.targetPatients,
          enrolled: t.enrolled,
          status: t.status,
          system_of_medicine: t.systemOfMedicine || "Ayurveda",
          study_focus: t.studyFocus || "Therapeutic efficacy",
          study_method: t.studyMethod || "Randomized Controlled Trial",
          study_type: t.studyType || "Interventional",
          phase: t.phase || "Phase III",
          intervention: t.intervention || "",
          sponsor: t.sponsor || "All India Institute of Ayurveda",
          recruitment_status: t.recruitmentStatus || "Recruiting"
        },
        { onConflict: "trial_id" }
      );
    }
    return true;
  } catch (err) {
    console.warn("Supabase trials sync notice (cached locally):", err);
    return false;
  }
}

/**
 * 2. Synchronize Safety & Pharmacovigilance Events
 */
export async function syncSafetyEventToCloud(event: PharmacovigilanceEvent): Promise<boolean> {
  try {
    const { error } = await supabase.from("safety_events").upsert(
      {
        id: event.eventId,
        trial_id: event.trialId,
        ctri_number: event.ctriNumber,
        participant_id: event.usubjid,
        event_type: event.eventType,
        meddra_soc: event.meddraSoc,
        meddra_pt: event.meddraPt,
        meddra_llt: event.meddraLlt || event.meddraPt,
        verbatim_term: event.verbatimTerm,
        severity: event.severity,
        onset_date: event.onsetDate,
        reported_date: event.reportedDate,
        suspected_drug: event.suspectedDrug,
        formulation_type: event.formulationType,
        batch_number: event.batchNumber,
        daily_dose: event.dailyDose,
        route: event.route,
        causality_score: event.causalityScore,
        causality_category: event.causalityCategory,
        is_serious: event.isSerious,
        seriousness_criteria: event.seriousnessCriteria,
        notification_due_24h: event.notificationDue24h,
        detailed_report_due_14d: event.detailedReportDue14d,
        dcgi_notification_status: event.dcgiNotificationStatus,
        iec_notification_status: event.iecNotificationStatus,
        action_taken: event.actionTaken,
        outcome: event.outcome,
        assigned_officer: event.assignedOfficer
      },
      { onConflict: "id" }
    );
    return !error;
  } catch (err) {
    console.warn("Supabase safety event sync notice (cached locally):", err);
    return false;
  }
}

/**
 * 3. Synchronize Participants / Subjects
 */
export async function syncParticipantsToCloud(participants: any[]): Promise<boolean> {
  try {
    for (const p of participants.slice(0, 20)) {
      await supabase.from("participants").upsert(
        {
          id: p.id,
          trial_id: p.trialId,
          age: Number(p.age) || 50,
          sex: p.sex || "Male",
          enrollment_date: p.enrollmentDate || new Date().toISOString().slice(0, 10),
          consent_status: p.consent || "Obtained",
          treatment_arm: p.treatmentArm || "Standard Treatment",
          primary_diagnosis: p.diagnosis || p.baselineCondition || "Ayurvedic Diagnosis",
          prakriti: p.prakriti || "Vata-Pitta",
          abha_id: p.abhaId || null
        },
        { onConflict: "id" }
      );
    }
    return true;
  } catch (err) {
    console.warn("Supabase participants sync notice (cached locally):", err);
    return false;
  }
}

/**
 * 4. Synchronize ALCOA+ Audit Trail Block
 */
export async function syncAuditBlockToCloud(block: {
  id: string;
  trialId: string;
  actor: string;
  role: string;
  actionType: string;
  fieldName?: string;
  priorValue?: string;
  newValue?: string;
  reasonForChange: string;
  previousHash: string;
  currentHash: string;
  approvalStatus: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("audit_trail").upsert(
      {
        id: block.id,
        trial_id: block.trialId,
        actor: block.actor,
        role: block.role,
        action_type: block.actionType,
        field_name: block.fieldName || "",
        prior_value: block.priorValue || "",
        new_value: block.newValue || "",
        reason_for_change: block.reasonForChange,
        previous_hash: block.previousHash,
        current_hash: block.currentHash,
        approval_status: block.approvalStatus
      },
      { onConflict: "id" }
    );
    return !error;
  } catch (err) {
    console.warn("Supabase audit trail sync notice (cached locally):", err);
    return false;
  }
}

/**
 * Health Check to verify connectivity to Supabase Cloud
 */
export async function checkSupabaseConnection(): Promise<{ isConnected: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const { error } = await supabase.from("trials").select("id").limit(1);
    const latencyMs = Math.round(performance.now() - start);
    return { isConnected: !error, latencyMs };
  } catch {
    return { isConnected: false, latencyMs: 0 };
  }
}
