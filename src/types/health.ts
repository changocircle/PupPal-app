/**
 * Health & Vaccination Tracker Types — PRD-05
 *
 * Data models for vaccinations, medications, weight,
 * vet visits, milestones, and health notes.
 */

// ─── Vaccination ────────────────────────────────────

export type VaccineType = "core" | "non_core";
export type VaccinationStatus =
  | "upcoming"
  | "due_soon"
  | "overdue"
  | "completed"
  | "skipped"
  | "unknown";

export interface ScheduledVaccination {
  id: string;
  dogId: string;
  vaccineName: string; // "DHPP Booster #2"
  vaccineKey: string; // "dhpp", "rabies" etc. (template key)
  vaccineType: VaccineType;
  doseNumber: number;
  dueDate: string; // ISO date
  dueWindowStart: string;
  dueWindowEnd: string;
  status: VaccinationStatus;
  completedAt: string | null;
  completedNotes: string | null;
  vetName: string | null;
  breedNote: string | null;
}

export interface VaccineTemplate {
  key: string;
  name: string;
  type: VaccineType;
  doses: {
    doseNumber: number;
    ageWeeks: number; // when due
    windowStartWeeks: number; // earliest acceptable
    windowEndWeeks: number; // latest acceptable
    label: string; // "DHPP #1"
  }[];
  boosters?: {
    intervalMonths: number;
    label: string;
  };
  description: string;
  whoNeeds?: string; // for non-core
}

// ─── Medication ─────────────────────────────────────

export type MedicationCategory =
  | "flea_tick"
  | "heartworm"
  | "deworming"
  | "dental"
  | "supplement"
  | "antibiotic"
  | "pain"
  | "other";

export type MedicationFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "as_needed"
  | "one_time";

export interface Medication {
  id: string;
  dogId: string;
  name: string;
  category: MedicationCategory;
  dosage: string | null;
  frequency: MedicationFrequency;
  startDate: string;
  endDate: string | null;
  nextDue: string | null;
  notes: string | null;
  prescribedBy: string | null;
  active: boolean;
  createdAt: string;
}

export interface MedicationEvent {
  id: string;
  medicationId: string;
  dogId: string;
  administeredAt: string;
  notes: string | null;
  loggedAt: string;
}

// ─── Weight ─────────────────────────────────────────

export type WeightUnit = "lbs" | "kg";
export type WeightRange = "below" | "normal" | "above";

export interface WeightEntry {
  id: string;
  dogId: string;
  weightValue: number;
  weightUnit: WeightUnit;
  weightKg: number; // normalised
  measuredAt: string; // ISO date
  notes: string | null;
  ageAtMeasurementWeeks: number;
  withinBreedRange: WeightRange;
  loggedAt: string;
}

// ─── Vet Visit ──────────────────────────────────────

export type VisitType =
  | "wellness_check"
  | "vaccination"
  | "sick_visit"
  | "emergency"
  | "surgery"
  | "dental"
  | "grooming_medical"
  | "other";

export interface VetVisit {
  id: string;
  dogId: string;
  visitType: VisitType;
  visitDate: string;
  vetClinic: string | null;
  vetName: string | null;
  reason: string;
  diagnosis: string | null;
  treatment: string | null;
  followUpNeeded: boolean;
  followUpDate: string | null;
  followUpNotes: string | null;
  cost: number | null;
  notes: string | null;
  loggedAt: string;
}

// ─── Vet Contact ────────────────────────────────────

export interface VetContact {
  id: string;
  userId: string;
  clinicName: string;
  vetName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  isPrimary: boolean;
  isEmergency: boolean;
  notes: string | null;
}

// ─── Developmental Milestone ────────────────────────

export type MilestoneCategory = "physical" | "behavioral" | "health";
export type MilestoneStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "skipped";

export interface DevelopmentalMilestone {
  id: string;
  name: string;
  category: MilestoneCategory;
  description: string;
  typicalAgeWeeksStart: number;
  typicalAgeWeeksEnd: number;
  tips: string[];
  buddyMessage: string;
  isTrackable: boolean;
}

export interface UserMilestone {
  id: string;
  dogId: string;
  milestoneId: string;
  status: MilestoneStatus;
  expectedDateStart: string;
  expectedDateEnd: string;
  actualDate: string | null;
  notes: string | null;
  loggedAt: string | null;
}

// ─── Health Note ────────────────────────────────────

export type HealthNoteCategory =
  | "observation"
  | "diet"
  | "behavior"
  | "skin_coat"
  | "digestive"
  | "injury"
  | "medication"
  | "general";

export type HealthNoteSeverity = "info" | "monitor" | "concern" | "urgent";

export interface HealthNote {
  id: string;
  dogId: string;
  content: string;
  category: HealthNoteCategory;
  severity: HealthNoteSeverity;
  followUpDate: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Category Meta ──────────────────────────────────

export const MEDICATION_CATEGORY_META: Record<
  MedicationCategory,
  { label: string; icon: string }
> = {
  flea_tick: { label: "Flea & Tick", icon: "🦟" },
  heartworm: { label: "Heartworm", icon: "❤️" },
  deworming: { label: "Deworming", icon: "🪱" },
  dental: { label: "Dental", icon: "🦷" },
  supplement: { label: "Supplement", icon: "💊" },
  antibiotic: { label: "Antibiotic", icon: "💉" },
  pain: { label: "Pain Relief", icon: "🩹" },
  other: { label: "Other", icon: "💊" },
};

export const VISIT_TYPE_META: Record<
  VisitType,
  { label: string; icon: string }
> = {
  wellness_check: { label: "Wellness Check", icon: "✅" },
  vaccination: { label: "Vaccination", icon: "💉" },
  sick_visit: { label: "Sick Visit", icon: "🤒" },
  emergency: { label: "Emergency", icon: "🚨" },
  surgery: { label: "Surgery", icon: "🏥" },
  dental: { label: "Dental", icon: "🦷" },
  grooming_medical: { label: "Grooming", icon: "✂️" },
  other: { label: "Other", icon: "📋" },
};

export const NOTE_SEVERITY_META: Record<
  HealthNoteSeverity,
  { label: string; color: string; bgColor: string }
> = {
  info: { label: "Info", color: "#5B9BD5", bgColor: "#EBF3FA" },
  monitor: { label: "Monitor", color: "#F5A623", bgColor: "#FFF6E5" },
  concern: { label: "Concern", color: "#EF6461", bgColor: "#FDEDED" },
  urgent: { label: "Urgent", color: "#DC2626", bgColor: "#FEE2E2" },
};

export const NOTE_CATEGORY_META: Record<
  HealthNoteCategory,
  { label: string; icon: string }
> = {
  observation: { label: "Observation", icon: "👁️" },
  diet: { label: "Diet", icon: "🍖" },
  behavior: { label: "Behavior", icon: "🐾" },
  skin_coat: { label: "Skin & Coat", icon: "✨" },
  digestive: { label: "Digestive", icon: "🤢" },
  injury: { label: "Injury", icon: "🩹" },
  medication: { label: "Medication", icon: "💊" },
  general: { label: "General", icon: "📝" },
};

export const MILESTONE_CATEGORY_META: Record<
  MilestoneCategory,
  { label: string; color: string; bgColor: string }
> = {
  physical: { label: "Physical", color: "#5B9BD5", bgColor: "#EBF3FA" },
  behavioral: { label: "Behavioral", color: "#F5A623", bgColor: "#FFF6E5" },
  health: { label: "Health", color: "#5CB882", bgColor: "#E8F5EE" },
};
