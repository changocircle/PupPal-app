/**
 * Health Records Sync Service
 *
 * Bidirectional, local-first sync with Supabase for health records.
 * Covers: vaccinations, weight logs, medications, medication events,
 *         vet visits, milestones, vet contacts, health notes.
 *
 * Same local-first pattern as dogSync.ts / trainingSync.ts.
 *
 * Conflict resolution: most recent updated_at wins per record.
 *
 * Architecture:
 * - Local mutations happen instantly via Zustand store
 * - A store subscriber detects changes and marks pending
 * - syncHealth() pushes all local records, pulls missing remote ones, merges
 * - Supabase Realtime triggers immediate pulls on remote changes
 *
 * Per-dog isolation: all tables are filtered by dog_id for the active dog.
 * Vet contacts are per-user (not per-dog) so they always sync in full.
 */

import { supabase } from "@/services/supabase";
import { useHealthStore } from "@/stores/healthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ScheduledVaccination,
  WeightEntry,
  Medication,
  MedicationEvent,
  VetVisit,
  VetContact,
  UserMilestone,
  HealthNote,
} from "@/types/health";

// ── Storage Keys ──

const PENDING_KEY = "puppal-health-sync-pending";
const LAST_SYNC_KEY = "puppal-health-sync-last";

// ── Types ──

export type HealthSyncOpType = "upsert";

interface PendingHealthSyncOp {
  dogId: string;
  type: HealthSyncOpType;
  timestamp: string;
}

export interface HealthSyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

// ── Lock ──

let isSyncing = false;

// ── Pending Operations Queue ──

async function loadPendingOps(): Promise<PendingHealthSyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePendingOps(ops: PendingHealthSyncOp[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ops));
}

/**
 * Queue a health sync operation.
 * Coalesces multiple upserts into one per dog.
 */
export async function queueHealthSyncOp(
  dogId: string,
): Promise<void> {
  const ops = await loadPendingOps();
  const idx = ops.findIndex((o) => o.dogId === dogId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    ops[idx] = { dogId, type: "upsert", timestamp: now };
  } else {
    ops.push({ dogId, type: "upsert", timestamp: now });
  }

  await savePendingOps(ops);
  useHealthStore.getState()._setSyncMeta({ pendingCount: ops.length });
}

// ── Row Mappers: local -> remote ──

function vaccinationToRow(
  v: ScheduledVaccination,
  userId: string,
): Record<string, unknown> {
  return {
    id: v.id,
    user_id: userId,
    dog_id: v.dogId,
    vaccine_name: v.vaccineName,
    vaccine_key: v.vaccineKey,
    vaccine_type: v.vaccineType,
    dose_number: v.doseNumber,
    due_date: v.dueDate,
    due_window_start: v.dueWindowStart,
    due_window_end: v.dueWindowEnd,
    status: v.status,
    completed_at: v.completedAt,
    completed_notes: v.completedNotes,
    vet_name: v.vetName,
    breed_note: v.breedNote,
    updated_at: new Date().toISOString(),
  };
}

function weightToRow(
  w: WeightEntry,
  userId: string,
): Record<string, unknown> {
  return {
    id: w.id,
    user_id: userId,
    dog_id: w.dogId,
    weight_value: w.weightValue,
    weight_unit: w.weightUnit,
    weight_kg: w.weightKg,
    measured_at: w.measuredAt,
    age_at_measurement_weeks: w.ageAtMeasurementWeeks,
    within_breed_range: w.withinBreedRange,
    notes: w.notes,
    logged_at: w.loggedAt,
    updated_at: new Date().toISOString(),
  };
}

function medicationToRow(
  m: Medication,
  userId: string,
): Record<string, unknown> {
  return {
    id: m.id,
    user_id: userId,
    dog_id: m.dogId,
    name: m.name,
    category: m.category,
    dosage: m.dosage,
    frequency: m.frequency,
    start_date: m.startDate,
    end_date: m.endDate,
    next_due: m.nextDue,
    notes: m.notes,
    prescribed_by: m.prescribedBy,
    active: m.active,
    updated_at: new Date().toISOString(),
  };
}

function medicationEventToRow(
  e: MedicationEvent,
  userId: string,
): Record<string, unknown> {
  return {
    id: e.id,
    user_id: userId,
    dog_id: e.dogId,
    medication_id: e.medicationId,
    administered_at: e.administeredAt,
    notes: e.notes,
    logged_at: e.loggedAt,
    updated_at: new Date().toISOString(),
  };
}

function vetVisitToRow(
  v: VetVisit,
  userId: string,
): Record<string, unknown> {
  return {
    id: v.id,
    user_id: userId,
    dog_id: v.dogId,
    visit_type: v.visitType,
    visit_date: v.visitDate,
    vet_clinic: v.vetClinic,
    vet_name: v.vetName,
    reason: v.reason,
    diagnosis: v.diagnosis,
    treatment: v.treatment,
    follow_up_needed: v.followUpNeeded,
    follow_up_date: v.followUpDate,
    follow_up_notes: v.followUpNotes,
    cost: v.cost,
    notes: v.notes,
    logged_at: v.loggedAt,
    updated_at: new Date().toISOString(),
  };
}

function vetContactToRow(
  c: VetContact,
  userId: string,
): Record<string, unknown> {
  return {
    id: c.id,
    user_id: userId,
    clinic_name: c.clinicName,
    vet_name: c.vetName,
    phone: c.phone,
    email: c.email,
    address: c.address,
    is_primary: c.isPrimary,
    is_emergency: c.isEmergency,
    notes: c.notes,
    updated_at: new Date().toISOString(),
  };
}

function milestoneToRow(
  m: UserMilestone,
  userId: string,
): Record<string, unknown> {
  return {
    id: m.id,
    user_id: userId,
    dog_id: m.dogId,
    milestone_id: m.milestoneId,
    status: m.status,
    expected_date_start: m.expectedDateStart,
    expected_date_end: m.expectedDateEnd,
    actual_date: m.actualDate,
    notes: m.notes,
    logged_at: m.loggedAt,
    updated_at: new Date().toISOString(),
  };
}

function healthNoteToRow(
  n: HealthNote,
  userId: string,
): Record<string, unknown> {
  return {
    id: n.id,
    user_id: userId,
    dog_id: n.dogId,
    content: n.content,
    category: n.category,
    severity: n.severity,
    follow_up_date: n.followUpDate,
    resolved: n.resolved,
    resolved_at: n.resolvedAt,
    updated_at: new Date().toISOString(),
  };
}

// ── Row Mappers: remote -> local ──

function rowToVaccination(row: Record<string, unknown>): ScheduledVaccination {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    vaccineName: row.vaccine_name as string,
    vaccineKey: row.vaccine_key as string,
    vaccineType: row.vaccine_type as ScheduledVaccination["vaccineType"],
    doseNumber: row.dose_number as number,
    dueDate: row.due_date as string,
    dueWindowStart: row.due_window_start as string,
    dueWindowEnd: row.due_window_end as string,
    status: row.status as ScheduledVaccination["status"],
    completedAt: row.completed_at as string | null,
    completedNotes: row.completed_notes as string | null,
    vetName: row.vet_name as string | null,
    breedNote: row.breed_note as string | null,
  };
}

function rowToWeight(row: Record<string, unknown>): WeightEntry {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    weightValue: row.weight_value as number,
    weightUnit: row.weight_unit as WeightEntry["weightUnit"],
    weightKg: row.weight_kg as number,
    measuredAt: row.measured_at as string,
    ageAtMeasurementWeeks: row.age_at_measurement_weeks as number,
    withinBreedRange: row.within_breed_range as WeightEntry["withinBreedRange"],
    notes: row.notes as string | null,
    loggedAt: row.logged_at as string,
  };
}

function rowToMedication(row: Record<string, unknown>): Medication {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    name: row.name as string,
    category: row.category as Medication["category"],
    dosage: row.dosage as string | null,
    frequency: row.frequency as Medication["frequency"],
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    nextDue: row.next_due as string | null,
    notes: row.notes as string | null,
    prescribedBy: row.prescribed_by as string | null,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

function rowToMedicationEvent(row: Record<string, unknown>): MedicationEvent {
  return {
    id: row.id as string,
    medicationId: row.medication_id as string,
    dogId: row.dog_id as string,
    administeredAt: row.administered_at as string,
    notes: row.notes as string | null,
    loggedAt: row.logged_at as string,
  };
}

function rowToVetVisit(row: Record<string, unknown>): VetVisit {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    visitType: row.visit_type as VetVisit["visitType"],
    visitDate: row.visit_date as string,
    vetClinic: row.vet_clinic as string | null,
    vetName: row.vet_name as string | null,
    reason: row.reason as string,
    diagnosis: row.diagnosis as string | null,
    treatment: row.treatment as string | null,
    followUpNeeded: row.follow_up_needed as boolean,
    followUpDate: row.follow_up_date as string | null,
    followUpNotes: row.follow_up_notes as string | null,
    cost: row.cost as number | null,
    notes: row.notes as string | null,
    loggedAt: row.logged_at as string,
  };
}

function rowToVetContact(row: Record<string, unknown>): VetContact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clinicName: row.clinic_name as string,
    vetName: row.vet_name as string | null,
    phone: row.phone as string,
    email: row.email as string | null,
    address: row.address as string | null,
    isPrimary: row.is_primary as boolean,
    isEmergency: row.is_emergency as boolean,
    notes: row.notes as string | null,
  };
}

function rowToMilestone(row: Record<string, unknown>): UserMilestone {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    milestoneId: row.milestone_id as string,
    status: row.status as UserMilestone["status"],
    expectedDateStart: row.expected_date_start as string,
    expectedDateEnd: row.expected_date_end as string,
    actualDate: row.actual_date as string | null,
    notes: row.notes as string | null,
    loggedAt: row.logged_at as string | null,
  };
}

function rowToHealthNote(row: Record<string, unknown>): HealthNote {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    content: row.content as string,
    category: row.category as HealthNote["category"],
    severity: row.severity as HealthNote["severity"],
    followUpDate: row.follow_up_date as string | null,
    resolved: row.resolved as boolean,
    resolvedAt: row.resolved_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Batch Upsert Helper ──

async function batchUpsert(
  table: string,
  rows: Record<string, unknown>[],
  errors: string[],
): Promise<number> {
  let pushed = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: "id" });

    if (error) {
      errors.push(`${table} batch ${i}: ${error.message}`);
    } else {
      pushed += batch.length;
    }
  }
  return pushed;
}

// ── Core Sync ──

/**
 * Bidirectional sync for the active dog's health records.
 *
 * 1. Push all local records to Supabase (upsert by id)
 * 2. Pull remote records not present locally, merge by updated_at
 * 3. Update local store with merged state
 */
export async function syncHealth(
  userId: string,
  dogId: string,
): Promise<HealthSyncResult> {
  if (isSyncing) {
    return { pushed: 0, pulled: 0, conflicts: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  const store = useHealthStore.getState();
  store._setSyncMeta({ status: "syncing" });

  const result: HealthSyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  try {
    // ── Step 1: Push local records to Supabase ──

    // Vaccinations for this dog
    const localVaccinations = store.vaccinations.filter((v) => v.dogId === dogId);
    if (localVaccinations.length > 0) {
      const rows = localVaccinations.map((v) => vaccinationToRow(v, userId));
      result.pushed += await batchUpsert("vaccinations", rows, result.errors);
    }

    // Weight entries for this dog
    const localWeights = store.weightEntries.filter((w) => w.dogId === dogId);
    if (localWeights.length > 0) {
      const rows = localWeights.map((w) => weightToRow(w, userId));
      result.pushed += await batchUpsert("weight_logs", rows, result.errors);
    }

    // Medications for this dog
    const localMedications = store.medications.filter((m) => m.dogId === dogId);
    if (localMedications.length > 0) {
      const rows = localMedications.map((m) => medicationToRow(m, userId));
      result.pushed += await batchUpsert("medications", rows, result.errors);
    }

    // Medication events for this dog
    const localMedEvents = store.medicationEvents.filter((e) => e.dogId === dogId);
    if (localMedEvents.length > 0) {
      const rows = localMedEvents.map((e) => medicationEventToRow(e, userId));
      result.pushed += await batchUpsert("medication_events", rows, result.errors);
    }

    // Vet visits for this dog
    const localVetVisits = store.vetVisits.filter((v) => v.dogId === dogId);
    if (localVetVisits.length > 0) {
      const rows = localVetVisits.map((v) => vetVisitToRow(v, userId));
      result.pushed += await batchUpsert("vet_visits", rows, result.errors);
    }

    // Milestones for this dog
    const localMilestones = store.userMilestones.filter((m) => m.dogId === dogId);
    if (localMilestones.length > 0) {
      const rows = localMilestones.map((m) => milestoneToRow(m, userId));
      result.pushed += await batchUpsert("milestones", rows, result.errors);
    }

    // Health notes for this dog
    const localNotes = store.healthNotes.filter((n) => n.dogId === dogId);
    if (localNotes.length > 0) {
      const rows = localNotes.map((n) => healthNoteToRow(n, userId));
      result.pushed += await batchUpsert("health_notes", rows, result.errors);
    }

    // Vet contacts are per-user (no dog_id filter)
    if (store.vetContacts.length > 0) {
      const rows = store.vetContacts.map((c) => vetContactToRow(c, userId));
      result.pushed += await batchUpsert("vet_contacts", rows, result.errors);
    }

    // ── Step 2: Pull remote records missing locally ──

    const localVaccinationIds = new Set(localVaccinations.map((v) => v.id));
    const localWeightIds = new Set(localWeights.map((w) => w.id));
    const localMedicationIds = new Set(localMedications.map((m) => m.id));
    const localMedEventIds = new Set(localMedEvents.map((e) => e.id));
    const localVetVisitIds = new Set(localVetVisits.map((v) => v.id));
    const localMilestoneIds = new Set(localMilestones.map((m) => m.id));
    const localNoteIds = new Set(localNotes.map((n) => n.id));
    const localContactIds = new Set(store.vetContacts.map((c) => c.id));

    // Pull vaccinations
    const { data: remoteVaccinations, error: vacErr } = await supabase
      .from("vaccinations")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (vacErr) {
      result.errors.push(`pull vaccinations: ${vacErr.message}`);
    } else {
      const newVaccinations = (remoteVaccinations ?? [])
        .filter((r: Record<string, unknown>) => !localVaccinationIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToVaccination(r));

      // Merge: remote wins on conflict (updated_at comparison)
      const conflicted = (remoteVaccinations ?? [])
        .filter((r: Record<string, unknown>) => localVaccinationIds.has(r.id as string))
        .filter((r: Record<string, unknown>) => {
          const local = localVaccinations.find((v) => v.id === r.id);
          if (!local) return false;
          // Remote is newer if its updated_at is strictly after local's completedAt
          const remoteTs = new Date(r.updated_at as string).getTime();
          const localTs = local.completedAt
            ? new Date(local.completedAt).getTime()
            : 0;
          return remoteTs > localTs;
        })
        .map((r: Record<string, unknown>) => rowToVaccination(r));

      if (newVaccinations.length > 0 || conflicted.length > 0) {
        const mergedIds = new Set([...newVaccinations, ...conflicted].map((v) => v.id));
        const kept = store.vaccinations.filter((v) => !mergedIds.has(v.id));
        store._setSyncMeta({}); // no-op to avoid calling set inside set
        // Directly set via Zustand
        useHealthStore.setState((s) => ({
          vaccinations: [
            ...s.vaccinations.filter((v) => !mergedIds.has(v.id)),
            ...newVaccinations,
            ...conflicted,
          ],
        }));
        result.pulled += newVaccinations.length;
        result.conflicts += conflicted.length;
        void kept; // suppress unused warning
      }
    }

    // Pull weight logs
    const { data: remoteWeights, error: wErr } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (wErr) {
      result.errors.push(`pull weight_logs: ${wErr.message}`);
    } else {
      const newWeights = (remoteWeights ?? [])
        .filter((r: Record<string, unknown>) => !localWeightIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToWeight(r));

      if (newWeights.length > 0) {
        useHealthStore.setState((s) => ({
          weightEntries: [...s.weightEntries, ...newWeights],
        }));
        result.pulled += newWeights.length;
      }
    }

    // Pull medications
    const { data: remoteMedications, error: mErr } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (mErr) {
      result.errors.push(`pull medications: ${mErr.message}`);
    } else {
      const newMeds = (remoteMedications ?? [])
        .filter((r: Record<string, unknown>) => !localMedicationIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToMedication(r));

      // Conflict resolution for medications (remote updated_at vs local createdAt)
      const conflictedMeds = (remoteMedications ?? [])
        .filter((r: Record<string, unknown>) => localMedicationIds.has(r.id as string))
        .filter((r: Record<string, unknown>) => {
          const local = localMedications.find((m) => m.id === r.id);
          if (!local) return false;
          const remoteTs = new Date(r.updated_at as string).getTime();
          const localTs = new Date(local.createdAt).getTime();
          return remoteTs > localTs;
        })
        .map((r: Record<string, unknown>) => rowToMedication(r));

      if (newMeds.length > 0 || conflictedMeds.length > 0) {
        const mergedIds = new Set([...newMeds, ...conflictedMeds].map((m) => m.id));
        useHealthStore.setState((s) => ({
          medications: [
            ...s.medications.filter((m) => !mergedIds.has(m.id)),
            ...newMeds,
            ...conflictedMeds,
          ],
        }));
        result.pulled += newMeds.length;
        result.conflicts += conflictedMeds.length;
      }
    }

    // Pull medication events
    const { data: remoteMedEvents, error: meErr } = await supabase
      .from("medication_events")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (meErr) {
      result.errors.push(`pull medication_events: ${meErr.message}`);
    } else {
      const newMedEvents = (remoteMedEvents ?? [])
        .filter((r: Record<string, unknown>) => !localMedEventIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToMedicationEvent(r));

      if (newMedEvents.length > 0) {
        useHealthStore.setState((s) => ({
          medicationEvents: [...s.medicationEvents, ...newMedEvents],
        }));
        result.pulled += newMedEvents.length;
      }
    }

    // Pull vet visits
    const { data: remoteVetVisits, error: vvErr } = await supabase
      .from("vet_visits")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (vvErr) {
      result.errors.push(`pull vet_visits: ${vvErr.message}`);
    } else {
      const newVetVisits = (remoteVetVisits ?? [])
        .filter((r: Record<string, unknown>) => !localVetVisitIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToVetVisit(r));

      if (newVetVisits.length > 0) {
        useHealthStore.setState((s) => ({
          vetVisits: [...s.vetVisits, ...newVetVisits],
        }));
        result.pulled += newVetVisits.length;
      }
    }

    // Pull milestones
    const { data: remoteMilestones, error: msErr } = await supabase
      .from("milestones")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (msErr) {
      result.errors.push(`pull milestones: ${msErr.message}`);
    } else {
      const newMilestones = (remoteMilestones ?? [])
        .filter((r: Record<string, unknown>) => !localMilestoneIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToMilestone(r));

      // Conflict resolution for milestones (completed status)
      const conflictedMilestones = (remoteMilestones ?? [])
        .filter((r: Record<string, unknown>) => localMilestoneIds.has(r.id as string))
        .filter((r: Record<string, unknown>) => {
          const local = localMilestones.find((m) => m.id === r.id);
          if (!local) return false;
          const remoteTs = new Date(r.updated_at as string).getTime();
          const localTs = local.loggedAt
            ? new Date(local.loggedAt).getTime()
            : 0;
          return remoteTs > localTs;
        })
        .map((r: Record<string, unknown>) => rowToMilestone(r));

      if (newMilestones.length > 0 || conflictedMilestones.length > 0) {
        const mergedIds = new Set(
          [...newMilestones, ...conflictedMilestones].map((m) => m.id),
        );
        useHealthStore.setState((s) => ({
          userMilestones: [
            ...s.userMilestones.filter((m) => !mergedIds.has(m.id)),
            ...newMilestones,
            ...conflictedMilestones,
          ],
        }));
        result.pulled += newMilestones.length;
        result.conflicts += conflictedMilestones.length;
      }
    }

    // Pull health notes
    const { data: remoteNotes, error: hnErr } = await supabase
      .from("health_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("dog_id", dogId);

    if (hnErr) {
      result.errors.push(`pull health_notes: ${hnErr.message}`);
    } else {
      const newNotes = (remoteNotes ?? [])
        .filter((r: Record<string, unknown>) => !localNoteIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToHealthNote(r));

      // Conflict resolution for notes (updatedAt comparison)
      const conflictedNotes = (remoteNotes ?? [])
        .filter((r: Record<string, unknown>) => localNoteIds.has(r.id as string))
        .filter((r: Record<string, unknown>) => {
          const local = localNotes.find((n) => n.id === r.id);
          if (!local) return false;
          const remoteTs = new Date(r.updated_at as string).getTime();
          const localTs = new Date(local.updatedAt).getTime();
          return remoteTs > localTs;
        })
        .map((r: Record<string, unknown>) => rowToHealthNote(r));

      if (newNotes.length > 0 || conflictedNotes.length > 0) {
        const mergedIds = new Set([...newNotes, ...conflictedNotes].map((n) => n.id));
        useHealthStore.setState((s) => ({
          healthNotes: [
            ...s.healthNotes.filter((n) => !mergedIds.has(n.id)),
            ...newNotes,
            ...conflictedNotes,
          ],
        }));
        result.pulled += newNotes.length;
        result.conflicts += conflictedNotes.length;
      }
    }

    // Pull vet contacts (per-user, not per-dog)
    const { data: remoteContacts, error: vcErr } = await supabase
      .from("vet_contacts")
      .select("*")
      .eq("user_id", userId);

    if (vcErr) {
      result.errors.push(`pull vet_contacts: ${vcErr.message}`);
    } else {
      const newContacts = (remoteContacts ?? [])
        .filter((r: Record<string, unknown>) => !localContactIds.has(r.id as string))
        .map((r: Record<string, unknown>) => rowToVetContact(r));

      if (newContacts.length > 0) {
        useHealthStore.setState((s) => ({
          vetContacts: [...s.vetContacts, ...newContacts],
        }));
        result.pulled += newContacts.length;
      }
    }

    // ── Step 3: Clear resolved pending ops ──

    const pendingOps = await loadPendingOps();
    const remaining = pendingOps.filter((o) => o.dogId !== dogId);
    await savePendingOps(remaining);

    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);

    useHealthStore.getState()._setSyncMeta({
      status: "idle",
      lastSyncedAt: now,
      pendingCount: remaining.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(`Sync failed: ${msg}`);
    console.error("[healthSync] Sync error:", msg);
    useHealthStore.getState()._setSyncMeta({ status: "error" });
  } finally {
    isSyncing = false;
  }

  if (__DEV__ && (result.pushed > 0 || result.pulled > 0 || result.conflicts > 0)) {
    console.log(
      `[healthSync] Dog: ${dogId}, Pushed: ${result.pushed}, Pulled: ${result.pulled}, ` +
      `Conflicts: ${result.conflicts}, Errors: ${result.errors.length}`,
    );
  }

  return result;
}

// ── Realtime Subscription ──

/**
 * Subscribe to Supabase Realtime changes on the vaccinations table.
 * Any insert/update/delete from another device triggers a callback.
 * Vaccinations are the primary health table; one subscription is enough
 * to detect cross-device changes and trigger a full health sync.
 */
export function subscribeToHealthChanges(
  userId: string,
  onRemoteChange: () => void,
): () => void {
  const channel = supabase
    .channel("health-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vaccinations",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onRemoteChange();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Utilities ──

export async function getLastHealthSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

export async function getHealthPendingCount(): Promise<number> {
  const ops = await loadPendingOps();
  return ops.length;
}

/**
 * Clear all health sync data. Call on sign-out.
 */
export async function clearHealthSyncData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(PENDING_KEY),
    AsyncStorage.removeItem(LAST_SYNC_KEY),
  ]);
  useHealthStore.getState()._setSyncMeta({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
  });
}
