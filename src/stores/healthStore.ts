/**
 * Health Store — Zustand + AsyncStorage
 * PRD-05: vaccinations, medications, weight, vet visits, milestones, notes.
 *
 * Local-first: Supabase sync deferred.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import type {
  ScheduledVaccination,
  VaccinationStatus,
  Medication,
  MedicationEvent,
  MedicationCategory,
  MedicationFrequency,
  WeightEntry,
  WeightUnit,
  WeightRange,
  VetVisit,
  VisitType,
  VetContact,
  UserMilestone,
  MilestoneStatus,
  HealthNote,
  HealthNoteCategory,
  HealthNoteSeverity,
} from "@/types/health";
import { generateVaccinationSchedule } from "@/data/vaccinationSchedule";
import { MILESTONE_TEMPLATES } from "@/data/milestones";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

function nowISO(): string {
  return new Date().toISOString();
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 100) / 100;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100;
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0]!;
}

const FREQUENCY_DAYS: Record<MedicationFrequency, number | null> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  as_needed: null,
  one_time: null,
};

// ──────────────────────────────────────────────
// Store Interface
// ──────────────────────────────────────────────

interface HealthState {
  // ─── Vaccinations ───
  vaccinations: ScheduledVaccination[];
  vaccinationsInitialized: boolean;

  // ─── Medications ───
  medications: Medication[];
  medicationEvents: MedicationEvent[];

  // ─── Weight ───
  weightEntries: WeightEntry[];
  preferredWeightUnit: WeightUnit;

  // ─── Vet Visits ───
  vetVisits: VetVisit[];
  vetContacts: VetContact[];

  // ─── Milestones ───
  userMilestones: UserMilestone[];
  milestonesInitialized: boolean;

  // ─── Health Notes ───
  healthNotes: HealthNote[];

  // ─── Actions ───

  // Vaccinations
  initVaccinations: (params: {
    dogId: string;
    dateOfBirth: Date;
    ageWeeks: number;
    breed: string | null;
    enabledNonCore?: string[];
  }) => void;
  completeVaccination: (
    id: string,
    data: { completedAt?: string; vetName?: string; notes?: string }
  ) => void;
  skipVaccination: (id: string) => void;

  // Medications
  addMedication: (data: {
    dogId: string;
    name: string;
    category: MedicationCategory;
    dosage?: string;
    frequency: MedicationFrequency;
    startDate: string;
    endDate?: string;
    notes?: string;
    prescribedBy?: string;
  }) => string;
  logMedicationDose: (
    medicationId: string,
    dogId: string,
    data?: { notes?: string; administeredAt?: string }
  ) => void;
  deactivateMedication: (id: string) => void;

  // Weight
  addWeightEntry: (data: {
    dogId: string;
    weightValue: number;
    weightUnit: WeightUnit;
    ageWeeks: number;
    notes?: string;
    measuredAt?: string;
  }) => void;
  setPreferredWeightUnit: (unit: WeightUnit) => void;

  // Vet Visits
  addVetVisit: (data: {
    dogId: string;
    visitType: VisitType;
    visitDate: string;
    reason: string;
    vetClinic?: string;
    vetName?: string;
    diagnosis?: string;
    treatment?: string;
    followUpNeeded?: boolean;
    followUpDate?: string;
    cost?: number;
    notes?: string;
  }) => string;
  updateVetVisit: (id: string, data: Partial<VetVisit>) => void;

  // Vet Contacts
  addVetContact: (data: {
    userId: string;
    clinicName: string;
    vetName?: string;
    phone: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
    isEmergency?: boolean;
    notes?: string;
  }) => string;
  removeVetContact: (id: string) => void;

  // Milestones
  initMilestones: (dogId: string, dateOfBirth: Date) => void;
  completeMilestone: (
    id: string,
    data?: { actualDate?: string; notes?: string }
  ) => void;

  // Health Notes
  addHealthNote: (data: {
    dogId: string;
    content: string;
    category: HealthNoteCategory;
    severity?: HealthNoteSeverity;
    followUpDate?: string;
  }) => string;
  updateHealthNote: (id: string, data: Partial<HealthNote>) => void;
  resolveHealthNote: (id: string) => void;
  deleteHealthNote: (id: string) => void;

  // Selectors
  getVaccinationsForDog: (dogId: string) => ScheduledVaccination[];
  getUpcomingEvents: (
    dogId: string,
    limit?: number
  ) => { type: string; icon: string; title: string; dueDate: string; daysUntil: number }[];
  getActiveMedications: (dogId: string) => Medication[];
  getWeightHistory: (dogId: string) => WeightEntry[];
  getVetVisitsForDog: (dogId: string) => VetVisit[];
  getMilestonesForDog: (dogId: string) => (UserMilestone & { name: string; description: string; category: string; tips: string[] })[];
  getHealthNotesForDog: (dogId: string) => HealthNote[];
  getHealthSummary: (dogId: string) => {
    vaccinationStatus: "up_to_date" | "due_soon" | "overdue" | "not_set_up";
    activeMedCount: number;
    latestWeight: WeightEntry | null;
    nextVetVisit: VetVisit | null;
    unresolvedNotes: number;
  };
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      // ─── Initial state ───
      vaccinations: [],
      vaccinationsInitialized: false,
      medications: [],
      medicationEvents: [],
      weightEntries: [],
      preferredWeightUnit: "lbs",
      vetVisits: [],
      vetContacts: [],
      userMilestones: [],
      milestonesInitialized: false,
      healthNotes: [],

      // ═══════════════════════════════════════════
      // Vaccinations
      // ═══════════════════════════════════════════

      initVaccinations: (params) => {
        const schedule = generateVaccinationSchedule(params);
        set({ vaccinations: schedule, vaccinationsInitialized: true });
      },

      completeVaccination: (id, data) => {
        set((state) => ({
          vaccinations: state.vaccinations.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: "completed" as VaccinationStatus,
                  completedAt: data.completedAt ?? todayISO(),
                  vetName: data.vetName ?? v.vetName,
                  completedNotes: data.notes ?? v.completedNotes,
                }
              : v
          ),
        }));
      },

      skipVaccination: (id) => {
        set((state) => ({
          vaccinations: state.vaccinations.map((v) =>
            v.id === id
              ? { ...v, status: "skipped" as VaccinationStatus }
              : v
          ),
        }));
      },

      // ═══════════════════════════════════════════
      // Medications
      // ═══════════════════════════════════════════

      addMedication: (data) => {
        const id = nanoid();
        const freqDays = FREQUENCY_DAYS[data.frequency];
        const nextDue =
          freqDays != null
            ? addDaysToDate(data.startDate, freqDays)
            : null;

        const medication: Medication = {
          id,
          dogId: data.dogId,
          name: data.name,
          category: data.category,
          dosage: data.dosage ?? null,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate ?? null,
          nextDue,
          notes: data.notes ?? null,
          prescribedBy: data.prescribedBy ?? null,
          active: true,
          createdAt: nowISO(),
        };

        set((state) => ({
          medications: [...state.medications, medication],
        }));

        return id;
      },

      logMedicationDose: (medicationId, dogId, data) => {
        const event: MedicationEvent = {
          id: nanoid(),
          medicationId,
          dogId,
          administeredAt: data?.administeredAt ?? nowISO(),
          notes: data?.notes ?? null,
          loggedAt: nowISO(),
        };

        set((state) => {
          // Update next due date
          const med = state.medications.find((m) => m.id === medicationId);
          const freqDays = med ? FREQUENCY_DAYS[med.frequency] : null;
          const nextDue =
            freqDays != null
              ? addDaysToDate(todayISO(), freqDays)
              : null;

          return {
            medicationEvents: [...state.medicationEvents, event],
            medications: state.medications.map((m) =>
              m.id === medicationId ? { ...m, nextDue } : m
            ),
          };
        });
      },

      deactivateMedication: (id) => {
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? { ...m, active: false } : m
          ),
        }));
      },

      // ═══════════════════════════════════════════
      // Weight
      // ═══════════════════════════════════════════

      addWeightEntry: (data) => {
        const weightKg =
          data.weightUnit === "kg"
            ? data.weightValue
            : lbsToKg(data.weightValue);

        const entry: WeightEntry = {
          id: nanoid(),
          dogId: data.dogId,
          weightValue: data.weightValue,
          weightUnit: data.weightUnit,
          weightKg,
          measuredAt: data.measuredAt ?? todayISO(),
          notes: data.notes ?? null,
          ageAtMeasurementWeeks: data.ageWeeks,
          withinBreedRange: "normal", // TODO: compare against breed curve
          loggedAt: nowISO(),
        };

        set((state) => ({
          weightEntries: [...state.weightEntries, entry],
        }));
      },

      setPreferredWeightUnit: (unit) => {
        set({ preferredWeightUnit: unit });
      },

      // ═══════════════════════════════════════════
      // Vet Visits
      // ═══════════════════════════════════════════

      addVetVisit: (data) => {
        const id = nanoid();
        const visit: VetVisit = {
          id,
          dogId: data.dogId,
          visitType: data.visitType,
          visitDate: data.visitDate,
          vetClinic: data.vetClinic ?? null,
          vetName: data.vetName ?? null,
          reason: data.reason,
          diagnosis: data.diagnosis ?? null,
          treatment: data.treatment ?? null,
          followUpNeeded: data.followUpNeeded ?? false,
          followUpDate: data.followUpDate ?? null,
          followUpNotes: null,
          cost: data.cost ?? null,
          notes: data.notes ?? null,
          loggedAt: nowISO(),
        };

        set((state) => ({
          vetVisits: [...state.vetVisits, visit],
        }));

        return id;
      },

      updateVetVisit: (id, data) => {
        set((state) => ({
          vetVisits: state.vetVisits.map((v) =>
            v.id === id ? { ...v, ...data } : v
          ),
        }));
      },

      // ═══════════════════════════════════════════
      // Vet Contacts
      // ═══════════════════════════════════════════

      addVetContact: (data) => {
        const id = nanoid();
        const contact: VetContact = {
          id,
          userId: data.userId,
          clinicName: data.clinicName,
          vetName: data.vetName ?? null,
          phone: data.phone,
          email: data.email ?? null,
          address: data.address ?? null,
          isPrimary: data.isPrimary ?? false,
          isEmergency: data.isEmergency ?? false,
          notes: data.notes ?? null,
        };

        set((state) => ({
          vetContacts: [...state.vetContacts, contact],
        }));

        return id;
      },

      removeVetContact: (id) => {
        set((state) => ({
          vetContacts: state.vetContacts.filter((c) => c.id !== id),
        }));
      },

      // ═══════════════════════════════════════════
      // Milestones
      // ═══════════════════════════════════════════

      initMilestones: (dogId, dateOfBirth) => {
        const milestones: UserMilestone[] = MILESTONE_TEMPLATES.map((tmpl) => {
          const startDate = new Date(dateOfBirth);
          startDate.setDate(
            startDate.getDate() + tmpl.typicalAgeWeeksStart * 7
          );
          const endDate = new Date(dateOfBirth);
          endDate.setDate(
            endDate.getDate() + tmpl.typicalAgeWeeksEnd * 7
          );

          const now = new Date();
          let status: MilestoneStatus = "upcoming";
          if (now >= startDate && now <= endDate) status = "active";
          else if (now > endDate) status = "completed"; // assume past = done

          return {
            id: nanoid(),
            dogId,
            milestoneId: tmpl.id,
            status,
            expectedDateStart: startDate.toISOString().split("T")[0]!,
            expectedDateEnd: endDate.toISOString().split("T")[0]!,
            actualDate: null,
            notes: null,
            loggedAt: null,
          };
        });

        set({ userMilestones: milestones, milestonesInitialized: true });
      },

      completeMilestone: (id, data) => {
        set((state) => ({
          userMilestones: state.userMilestones.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: "completed" as MilestoneStatus,
                  actualDate: data?.actualDate ?? todayISO(),
                  notes: data?.notes ?? m.notes,
                  loggedAt: nowISO(),
                }
              : m
          ),
        }));
      },

      // ═══════════════════════════════════════════
      // Health Notes
      // ═══════════════════════════════════════════

      addHealthNote: (data) => {
        const id = nanoid();
        const note: HealthNote = {
          id,
          dogId: data.dogId,
          content: data.content,
          category: data.category,
          severity: data.severity ?? "info",
          followUpDate: data.followUpDate ?? null,
          resolved: false,
          resolvedAt: null,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };

        set((state) => ({
          healthNotes: [...state.healthNotes, note],
        }));

        return id;
      },

      updateHealthNote: (id, data) => {
        set((state) => ({
          healthNotes: state.healthNotes.map((n) =>
            n.id === id ? { ...n, ...data, updatedAt: nowISO() } : n
          ),
        }));
      },

      resolveHealthNote: (id) => {
        set((state) => ({
          healthNotes: state.healthNotes.map((n) =>
            n.id === id
              ? { ...n, resolved: true, resolvedAt: nowISO(), updatedAt: nowISO() }
              : n
          ),
        }));
      },

      deleteHealthNote: (id) => {
        set((state) => ({
          healthNotes: state.healthNotes.filter((n) => n.id !== id),
        }));
      },

      // ═══════════════════════════════════════════
      // Selectors
      // ═══════════════════════════════════════════

      getVaccinationsForDog: (dogId) => {
        return get().vaccinations.filter((v) => v.dogId === dogId);
      },

      getUpcomingEvents: (dogId, limit = 3) => {
        const today = todayISO();
        const todayMs = new Date(today).getTime();
        const events: {
          type: string;
          icon: string;
          title: string;
          dueDate: string;
          daysUntil: number;
        }[] = [];

        // Vaccinations
        for (const vax of get().vaccinations) {
          if (vax.dogId !== dogId) continue;
          if (vax.status === "completed" || vax.status === "skipped") continue;
          const daysUntil = Math.round(
            (new Date(vax.dueDate).getTime() - todayMs) / 86_400_000
          );
          events.push({
            type: "vaccination",
            icon: "💉",
            title: vax.vaccineName,
            dueDate: vax.dueDate,
            daysUntil,
          });
        }

        // Medications due
        for (const med of get().medications) {
          if (med.dogId !== dogId || !med.active || !med.nextDue) continue;
          const daysUntil = Math.round(
            (new Date(med.nextDue).getTime() - todayMs) / 86_400_000
          );
          if (daysUntil <= 7) {
            events.push({
              type: "medication",
              icon: "💊",
              title: med.name,
              dueDate: med.nextDue,
              daysUntil,
            });
          }
        }

        // Vet visit follow-ups
        for (const visit of get().vetVisits) {
          if (
            visit.dogId !== dogId ||
            !visit.followUpNeeded ||
            !visit.followUpDate
          )
            continue;
          const daysUntil = Math.round(
            (new Date(visit.followUpDate).getTime() - todayMs) / 86_400_000
          );
          if (daysUntil >= -7) {
            events.push({
              type: "vet_followup",
              icon: "🏥",
              title: `Follow-up: ${visit.reason.slice(0, 30)}`,
              dueDate: visit.followUpDate,
              daysUntil,
            });
          }
        }

        // Sort by date, take limit
        events.sort((a, b) => a.daysUntil - b.daysUntil);
        return events.slice(0, limit);
      },

      getActiveMedications: (dogId) => {
        return get().medications.filter(
          (m) => m.dogId === dogId && m.active
        );
      },

      getWeightHistory: (dogId) => {
        return get()
          .weightEntries.filter((w) => w.dogId === dogId)
          .sort(
            (a, b) =>
              new Date(a.measuredAt).getTime() -
              new Date(b.measuredAt).getTime()
          );
      },

      getVetVisitsForDog: (dogId) => {
        return get()
          .vetVisits.filter((v) => v.dogId === dogId)
          .sort(
            (a, b) =>
              new Date(b.visitDate).getTime() -
              new Date(a.visitDate).getTime()
          );
      },

      getMilestonesForDog: (dogId) => {
        return get()
          .userMilestones.filter((m) => m.dogId === dogId)
          .map((um) => {
            const tmpl = MILESTONE_TEMPLATES.find(
              (t) => t.id === um.milestoneId
            );
            return {
              ...um,
              name: tmpl?.name ?? "Unknown",
              description: tmpl?.description ?? "",
              category: tmpl?.category ?? "health",
              tips: tmpl?.tips ?? [],
            };
          })
          .sort(
            (a, b) =>
              new Date(a.expectedDateStart).getTime() -
              new Date(b.expectedDateStart).getTime()
          );
      },

      getHealthNotesForDog: (dogId) => {
        return get()
          .healthNotes.filter((n) => n.dogId === dogId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );
      },

      getHealthSummary: (dogId) => {
        const vaccinations = get().getVaccinationsForDog(dogId);
        const activeMeds = get().getActiveMedications(dogId);
        const weights = get().getWeightHistory(dogId);
        const visits = get().getVetVisitsForDog(dogId);
        const notes = get().getHealthNotesForDog(dogId);

        // Vaccination status
        let vaccinationStatus: "up_to_date" | "due_soon" | "overdue" | "not_set_up" =
          "not_set_up";
        if (vaccinations.length > 0) {
          if (vaccinations.some((v) => v.status === "overdue")) {
            vaccinationStatus = "overdue";
          } else if (vaccinations.some((v) => v.status === "due_soon")) {
            vaccinationStatus = "due_soon";
          } else {
            vaccinationStatus = "up_to_date";
          }
        }

        // Next upcoming vet visit
        const today = todayISO();
        const upcomingVisits = visits.filter((v) => v.visitDate >= today);
        const nextVetVisit =
          upcomingVisits.length > 0
            ? upcomingVisits[upcomingVisits.length - 1]! // visits sorted desc
            : null;

        return {
          vaccinationStatus,
          activeMedCount: activeMeds.length,
          latestWeight: weights.length > 0 ? weights[weights.length - 1]! : null,
          nextVetVisit,
          unresolvedNotes: notes.filter((n) => !n.resolved).length,
        };
      },
    }),
    {
      name: "puppal-health",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
