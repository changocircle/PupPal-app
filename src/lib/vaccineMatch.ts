/**
 * Fuzzy matching for extracted vaccine names against known templates.
 *
 * Maps messy AI-extracted names like "DAPP #2" or "Distemper combo"
 * to our canonical vaccine keys and dose numbers.
 */

import { CORE_VACCINES, NON_CORE_VACCINES } from "@/data/vaccinationSchedule";
import type { ExtractedVaccine } from "@/lib/vaccineExtract";

// Alias map: common alternative names -> our template key
const VACCINE_ALIASES: Record<string, string> = {
  // DHPP variants
  dhpp: "dhpp",
  dapp: "dhpp",
  da2pp: "dhpp",
  dhlpp: "dhpp",
  "5-in-1": "dhpp",
  "5 in 1": "dhpp",
  "4-in-1": "dhpp",
  "4 in 1": "dhpp",
  distemper: "dhpp",
  "distemper combo": "dhpp",
  "distemper/parvo": "dhpp",
  parvo: "dhpp",
  parvovirus: "dhpp",

  // Rabies
  rabies: "rabies",

  // Bordetella
  bordetella: "bordetella",
  "kennel cough": "bordetella",
  bordatella: "bordetella", // common misspelling

  // Leptospirosis
  leptospirosis: "leptospirosis",
  lepto: "leptospirosis",

  // Lyme
  lyme: "lyme",
  "lyme disease": "lyme",

  // Canine Influenza
  "canine influenza": "canine_influenza",
  "canine flu": "canine_influenza",
  "dog flu": "canine_influenza",
  h3n2: "canine_influenza",
  h3n8: "canine_influenza",
  influenza: "canine_influenza",
};

const ALL_TEMPLATES = [...CORE_VACCINES, ...NON_CORE_VACCINES];

export interface MatchedVaccine {
  vaccineKey: string;
  doseNumber: number;
  completedAt: string;
  vetName?: string;
  /** Original extracted name for display */
  originalName: string;
  /** Our canonical template name */
  matchedName: string;
  /** Whether the match is confident */
  confident: boolean;
}

/**
 * Match an extracted vaccine name to our template keys.
 * Returns the template key or null if no match.
 */
function matchVaccineName(name: string): string | null {
  const lower = name.toLowerCase().trim();

  // Direct alias match
  for (const [alias, key] of Object.entries(VACCINE_ALIASES)) {
    if (lower.includes(alias)) return key;
  }

  // Try matching against template names
  for (const tmpl of ALL_TEMPLATES) {
    if (lower.includes(tmpl.key.replace(/_/g, " "))) return tmpl.key;
    if (lower.includes(tmpl.name.toLowerCase())) return tmpl.key;
  }

  return null;
}

/**
 * Infer dose number if not provided or seems wrong.
 * Uses date proximity to template dose windows.
 */
function inferDoseNumber(
  vaccineKey: string,
  extractedDose: number,
  date: string,
  dateOfBirth: Date | null,
): number {
  // If extracted dose seems valid, trust it
  const template = ALL_TEMPLATES.find((t) => t.key === vaccineKey);
  if (!template) return extractedDose || 1;
  if (extractedDose >= 1 && extractedDose <= template.doses.length) return extractedDose;

  // Fallback: try to infer from date and DOB
  if (!dateOfBirth || !date) return 1;

  const vaccineDate = new Date(date);
  const ageAtVaccineWeeks = Math.round(
    (vaccineDate.getTime() - dateOfBirth.getTime()) / (7 * 86_400_000),
  );

  // Find the dose whose ageWeeks is closest
  let closestDose = 1;
  let closestDiff = Infinity;
  for (const dose of template.doses) {
    const diff = Math.abs(ageAtVaccineWeeks - dose.ageWeeks);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestDose = dose.doseNumber;
    }
  }

  return closestDose;
}

/**
 * Match extracted vaccines against our templates.
 * Returns matched vaccines ready for the confirmation screen.
 */
export function matchExtractedVaccines(
  extracted: ExtractedVaccine[],
  dateOfBirth: Date | null,
): MatchedVaccine[] {
  const results: MatchedVaccine[] = [];
  const seen = new Set<string>(); // Dedup: "dhpp-1", "rabies-1"

  for (const ev of extracted) {
    const key = matchVaccineName(ev.name);
    if (!key) continue;

    const template = ALL_TEMPLATES.find((t) => t.key === key);
    if (!template) continue;

    const doseNumber = inferDoseNumber(key, ev.doseNumber, ev.date, dateOfBirth);
    const dedup = `${key}-${doseNumber}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);

    results.push({
      vaccineKey: key,
      doseNumber,
      completedAt: ev.date,
      vetName: ev.vetClinic,
      originalName: ev.name,
      matchedName: template.name,
      confident: true,
    });
  }

  return results;
}
