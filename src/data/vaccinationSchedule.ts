/**
 * AAHA-Based Puppy Vaccination Templates, PRD-05 §4
 *
 * Generates a personalised vaccination schedule
 * based on the dog's date of birth / age.
 */

import type {
  VaccineTemplate,
  ScheduledVaccination,
  VaccinationStatus,
} from "@/types/health";
import { nanoid } from "nanoid/non-secure";

// ─── Core vaccine templates ──────────────────────────

export const CORE_VACCINES: VaccineTemplate[] = [
  {
    key: "dhpp",
    name: "DHPP",
    type: "core",
    description:
      "Distemper, Hepatitis, Parainfluenza, Parvovirus, essential protection against four deadly diseases.",
    doses: [
      {
        doseNumber: 1,
        ageWeeks: 7,
        windowStartWeeks: 6,
        windowEndWeeks: 8,
        label: "DHPP #1",
      },
      {
        doseNumber: 2,
        ageWeeks: 11,
        windowStartWeeks: 10,
        windowEndWeeks: 12,
        label: "DHPP #2",
      },
      {
        doseNumber: 3,
        ageWeeks: 15,
        windowStartWeeks: 14,
        windowEndWeeks: 16,
        label: "DHPP #3",
      },
    ],
    boosters: { intervalMonths: 12, label: "DHPP Annual Booster" },
  },
  {
    key: "rabies",
    name: "Rabies",
    type: "core",
    description:
      "Required by law in most areas. Protects against the fatal rabies virus.",
    doses: [
      {
        doseNumber: 1,
        ageWeeks: 14,
        windowStartWeeks: 12,
        windowEndWeeks: 16,
        label: "Rabies",
      },
    ],
    boosters: { intervalMonths: 12, label: "Rabies Booster" },
  },
  {
    key: "bordetella",
    name: "Bordetella",
    type: "core",
    description:
      "Kennel cough protection, recommended for puppies exposed to other dogs.",
    doses: [
      {
        doseNumber: 1,
        ageWeeks: 8,
        windowStartWeeks: 8,
        windowEndWeeks: 10,
        label: "Bordetella #1",
      },
      {
        doseNumber: 2,
        ageWeeks: 12,
        windowStartWeeks: 12,
        windowEndWeeks: 14,
        label: "Bordetella #2",
      },
    ],
    boosters: { intervalMonths: 12, label: "Bordetella Annual" },
  },
];

// ─── Non-core vaccine templates ──────────────────────

export const NON_CORE_VACCINES: VaccineTemplate[] = [
  {
    key: "leptospirosis",
    name: "Leptospirosis",
    type: "non_core",
    description: "Bacterial infection from contaminated water and wildlife.",
    whoNeeds:
      "Dogs with outdoor exposure, standing water, or wooded / wildlife areas.",
    doses: [
      {
        doseNumber: 1,
        ageWeeks: 12,
        windowStartWeeks: 12,
        windowEndWeeks: 14,
        label: "Lepto #1",
      },
      {
        doseNumber: 2,
        ageWeeks: 16,
        windowStartWeeks: 15,
        windowEndWeeks: 18,
        label: "Lepto #2",
      },
    ],
    boosters: { intervalMonths: 12, label: "Lepto Annual" },
  },
  {
    key: "lyme",
    name: "Lyme Disease",
    type: "non_core",
    description: "Tick-borne disease causing fever, joint pain, lethargy.",
    whoNeeds: "Dogs in tick-endemic areas (Northeast US, Upper Midwest, etc.).",
    doses: [
      {
        doseNumber: 1,
        ageWeeks: 12,
        windowStartWeeks: 12,
        windowEndWeeks: 14,
        label: "Lyme #1",
      },
      {
        doseNumber: 2,
        ageWeeks: 16,
        windowStartWeeks: 15,
        windowEndWeeks: 18,
        label: "Lyme #2",
      },
    ],
    boosters: { intervalMonths: 12, label: "Lyme Annual" },
  },
  {
    key: "canine_influenza",
    name: "Canine Influenza",
    type: "non_core",
    description: "Dog flu (H3N2/H3N8). Highly contagious among dogs.",
    whoNeeds: "Dogs in daycare, boarding, dog parks, or group settings.",
    doses: [
      {
        doseNumber: 1,
        ageWeeks: 8,
        windowStartWeeks: 8,
        windowEndWeeks: 10,
        label: "Canine Flu #1",
      },
      {
        doseNumber: 2,
        ageWeeks: 12,
        windowStartWeeks: 11,
        windowEndWeeks: 14,
        label: "Canine Flu #2",
      },
    ],
    boosters: { intervalMonths: 12, label: "Canine Flu Annual" },
  },
];

// ─── Breed-specific notes ────────────────────────────

const BREED_VACCINE_NOTES: Record<string, string> = {
  collie:
    "Collies may carry the MDR1 gene. Discuss vaccine sensitivities with your vet.",
  "shetland sheepdog":
    "Shelties may carry the MDR1 gene. Discuss vaccine sensitivities with your vet.",
  "australian shepherd":
    "Aussies may carry the MDR1 gene. Discuss vaccine sensitivities with your vet.",
  "border collie":
    "Border Collies may carry the MDR1 gene. Discuss vaccine reactions with your vet.",
  "miniature american shepherd":
    "May carry the MDR1 gene. Discuss vaccine sensitivities with your vet.",
};

// ─── Schedule generator ──────────────────────────────

function addWeeks(date: Date, weeks: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0]!;
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0]!;
}

/**
 * Determine status based on dates
 */
function computeStatus(
  dueDate: string,
  windowEnd: string,
  today: string
): VaccinationStatus {
  if (today > windowEnd) return "overdue";
  // "due_soon" = within 7 days
  const dueDateMs = new Date(dueDate).getTime();
  const todayMs = new Date(today).getTime();
  const daysUntil = (dueDateMs - todayMs) / 86_400_000;
  if (daysUntil <= 7 && daysUntil >= 0) return "due_soon";
  return "upcoming";
}

/**
 * Generate a personalised vaccination schedule for a puppy.
 */
export function generateVaccinationSchedule(params: {
  dogId: string;
  dateOfBirth: Date;
  ageWeeks: number;
  breed: string | null;
  enabledNonCore?: string[]; // vaccine keys
}): ScheduledVaccination[] {
  const {
    dogId,
    dateOfBirth,
    breed,
    enabledNonCore = [],
  } = params;

  const today = new Date().toISOString().split("T")[0]!;
  const breedLower = breed?.toLowerCase() ?? "";
  const breedNote =
    Object.entries(BREED_VACCINE_NOTES).find(([b]) =>
      breedLower.includes(b)
    )?.[1] ?? null;

  const allTemplates = [
    ...CORE_VACCINES,
    ...NON_CORE_VACCINES.filter((v) => enabledNonCore.includes(v.key)),
  ];

  const schedule: ScheduledVaccination[] = [];

  for (const tmpl of allTemplates) {
    for (const dose of tmpl.doses) {
      const dueDate = addWeeks(dateOfBirth, dose.ageWeeks);
      const windowStart = addWeeks(dateOfBirth, dose.windowStartWeeks);
      const windowEnd = addWeeks(dateOfBirth, dose.windowEndWeeks);

      // If due date is way in the past (> 8 weeks ago), mark unknown
      const daysOverdue =
        (new Date(today).getTime() - new Date(windowEnd).getTime()) /
        86_400_000;
      const status: VaccinationStatus =
        daysOverdue > 56 ? "unknown" : computeStatus(dueDate, windowEnd, today);

      schedule.push({
        id: nanoid(),
        dogId,
        vaccineName: dose.label,
        vaccineKey: tmpl.key,
        vaccineType: tmpl.type,
        doseNumber: dose.doseNumber,
        dueDate,
        dueWindowStart: windowStart,
        dueWindowEnd: windowEnd,
        status,
        completedAt: null,
        completedNotes: null,
        vetName: null,
        breedNote,
      });
    }
  }

  // Sort chronologically
  schedule.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return schedule;
}

/**
 * All vaccine templates for display/config.
 */
export function getAllVaccineTemplates(): VaccineTemplate[] {
  return [...CORE_VACCINES, ...NON_CORE_VACCINES];
}
