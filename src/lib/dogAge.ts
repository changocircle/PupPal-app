/**
 * Dog age formatting utilities.
 *
 * Calculates a live age from date_of_birth when available,
 * otherwise estimates from age_months_at_creation + elapsed time.
 */

export interface DogAgeResult {
  /** Formatted age string, e.g. "5 months" or "1 year, 3 months" */
  label: string;
  /** Whether this age is estimated (no confirmed DOB) */
  estimated: boolean;
}

/**
 * Calculate a human-readable age for a dog.
 *
 * @param dateOfBirth  ISO date string (YYYY-MM-DD) or null
 * @param ageMonthsAtCreation  age in months at time of signup, or null
 * @param createdAt  ISO datetime of the dog record creation
 * @returns  formatted age + estimated flag, or null if we have nothing to work with
 */
export function getDogAge(
  dateOfBirth: string | null | undefined,
  ageMonthsAtCreation: number | null | undefined,
  createdAt: string,
): DogAgeResult | null {
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    return { label: formatMonthDiff(dob, now), estimated: false };
  }

  if (ageMonthsAtCreation != null) {
    // Estimate: age at creation + months elapsed since creation
    const created = new Date(createdAt);
    const now = new Date();
    const elapsedMs = now.getTime() - created.getTime();
    const elapsedMonths = Math.max(0, Math.round(elapsedMs / (1000 * 60 * 60 * 24 * 30.44)));
    const totalMonths = ageMonthsAtCreation + elapsedMonths;
    return { label: formatTotalMonths(totalMonths), estimated: true };
  }

  return null;
}

/** Format the difference between two dates as a readable age string. */
function formatMonthDiff(from: Date, to: Date): string {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 1) {
    const totalMonths = years * 12 + months;
    if (totalMonths <= 0) return 'Under 1 month';
    return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  }

  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

/** Format a raw total-months number as a readable age string. */
function formatTotalMonths(total: number): string {
  if (total < 1) return 'Under 1 month';
  if (total < 12) return `${total} month${total !== 1 ? 's' : ''}`;
  const years = Math.floor(total / 12);
  const months = total % 12;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}
