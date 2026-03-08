/**
 * Journal Store, Zustand + AsyncStorage
 * PRD-10: Puppy Time Hop & Progress Timeline
 *
 * Local-first: all state persisted via AsyncStorage.
 * Handles manual entries (photos, notes) and auto-generated entries
 * (milestones, achievements, health events, etc.)
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import type {
  JournalEntry,
  JournalEntryType,
  JournalFilter,
  JournalSource,
  MonthGroup,
} from "@/types/journal";
import { calculateDogAgeLabel } from "@/types/journal";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ──────────────────────────────────────────────
// Store Interface
// ──────────────────────────────────────────────

interface JournalState {
  /** All journal entries */
  entries: JournalEntry[];

  // ─── Actions ───

  /** Add a manual (user-created) entry, photo or note */
  addManualEntry: (data: {
    dogId: string;
    entryType: "photo" | "note" | "weight";
    title: string;
    body?: string;
    photoUris?: string[];
    entryDate?: string;
    dogDateOfBirth?: string | null;
    referenceType?: string;
    referenceId?: string;
  }) => string;

  /** Add a system-generated (auto) entry */
  addAutoEntry: (data: {
    dogId: string;
    entryType: JournalEntryType;
    title: string;
    body?: string;
    entryDate?: string;
    dogDateOfBirth?: string | null;
    referenceType?: string;
    referenceId?: string;
  }) => string;

  /** Update a manual entry */
  updateEntry: (
    id: string,
    updates: Partial<Pick<JournalEntry, "title" | "body" | "photoUris" | "entryDate">>
  ) => void;

  /** Soft-delete a manual entry */
  deleteEntry: (id: string) => void;

  /** Toggle pin on an entry */
  togglePin: (id: string) => void;

  /** Hide an auto-generated entry (user can't delete, only hide) */
  hideEntry: (id: string) => void;

  // ─── Selectors ───

  /** Get visible entries for a month (excludes hidden/deleted) */
  getEntriesByMonth: (year: number, month: number) => JournalEntry[];

  /** Get entries grouped by month, sorted newest first */
  getMonthGroups: (filter?: JournalFilter) => MonthGroup[];

  /** Filter entries: all, photos only, milestones only */
  getFilteredEntries: (filter: JournalFilter) => JournalEntry[];

  /** Get visible (non-hidden, non-deleted) entries sorted by date desc */
  getVisibleEntries: () => JournalEntry[];

  /** Get pinned entries */
  getPinnedEntries: () => JournalEntry[];

  /** Get the most recent N entries for home screen preview */
  getRecentEntries: (limit?: number) => JournalEntry[];

  /** Get throwback entries from 1/3/6/12 months ago */
  getThrowbackEntries: () => JournalEntry[];

  /** Get total entry count (visible only) */
  getEntryCount: () => number;

  /** Get total photo count */
  getPhotoCount: () => number;

  /** Check if an auto-entry already exists for a reference */
  hasAutoEntry: (referenceType: string, referenceId: string) => boolean;

  /** Reset (for testing) */
  resetJournal: () => void;
}

// ──────────────────────────────────────────────
// Filter helpers
// ──────────────────────────────────────────────

const PHOTO_TYPES: JournalEntryType[] = ["photo"];

const MILESTONE_TYPES: JournalEntryType[] = [
  "exercise_milestone",
  "achievement",
  "streak_milestone",
  "score_milestone",
  "level_up",
  "trick_complete",
  "health_event",
  "developmental_milestone",
  "plan_milestone",
  "app_milestone",
];

function matchesFilter(entry: JournalEntry, filter: JournalFilter): boolean {
  if (filter === "all") return true;
  if (filter === "photos") return PHOTO_TYPES.includes(entry.entryType);
  if (filter === "milestones") return MILESTONE_TYPES.includes(entry.entryType);
  return true;
}

function isVisible(entry: JournalEntry): boolean {
  return !entry.isHidden && !entry.isDeleted;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      // ═══════════════════════════════════════════
      // Actions
      // ═══════════════════════════════════════════

      addManualEntry: (data) => {
        const id = nanoid();
        const entryDate = data.entryDate ?? todayISO();
        const isBackdated = entryDate !== todayISO();
        const ageLabel = calculateDogAgeLabel(data.dogDateOfBirth, entryDate);
        const now = nowISO();

        const entry: JournalEntry = {
          id,
          dogId: data.dogId,
          entryType: data.entryType,
          source: "user",
          title: data.title,
          body: data.body ?? null,
          photoUris: data.photoUris ?? [],
          entryDate,
          dogAgeLabel: ageLabel,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          isBackdated,
          isPinned: false,
          isHidden: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          entries: [...state.entries, entry],
        }));

        return id;
      },

      addAutoEntry: (data) => {
        // Idempotency: prevent duplicate auto-entries for the same reference
        if (
          data.referenceType &&
          data.referenceId &&
          get().hasAutoEntry(data.referenceType, data.referenceId)
        ) {
          return "";
        }

        const id = nanoid();
        const entryDate = data.entryDate ?? todayISO();
        const ageLabel = calculateDogAgeLabel(data.dogDateOfBirth, entryDate);
        const now = nowISO();

        const entry: JournalEntry = {
          id,
          dogId: data.dogId,
          entryType: data.entryType,
          source: "system",
          title: data.title,
          body: data.body ?? null,
          photoUris: [],
          entryDate,
          dogAgeLabel: ageLabel,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          isBackdated: false,
          isPinned: false,
          isHidden: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          entries: [...state.entries, entry],
        }));

        return id;
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.id !== id || e.source !== "user") return e;
            return { ...e, ...updates, updatedAt: nowISO() };
          }),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.id !== id || e.source !== "user") return e;
            return { ...e, isDeleted: true, updatedAt: nowISO() };
          }),
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.id !== id) return e;
            return { ...e, isPinned: !e.isPinned, updatedAt: nowISO() };
          }),
        }));
      },

      hideEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((e) => {
            if (e.id !== id || e.source !== "system") return e;
            return { ...e, isHidden: true, updatedAt: nowISO() };
          }),
        }));
      },

      // ═══════════════════════════════════════════
      // Selectors
      // ═══════════════════════════════════════════

      getEntriesByMonth: (year, month) => {
        return get()
          .entries.filter((e) => {
            if (!isVisible(e)) return false;
            const d = new Date(e.entryDate);
            return d.getFullYear() === year && d.getMonth() + 1 === month;
          })
          .sort(
            (a, b) =>
              new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          );
      },

      getMonthGroups: (filter = "all") => {
        const visible = get()
          .entries.filter((e) => isVisible(e) && matchesFilter(e, filter))
          .sort(
            (a, b) =>
              new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          );

        const groupMap = new Map<string, MonthGroup>();

        for (const entry of visible) {
          const d = new Date(entry.entryDate);
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const key = `${year}-${month}`;

          if (!groupMap.has(key)) {
            groupMap.set(key, {
              year,
              month,
              label: `${MONTH_NAMES[month - 1]} ${year}`,
              entries: [],
            });
          }

          groupMap.get(key)!.entries.push(entry);
        }

        // Return groups sorted newest first
        return Array.from(groupMap.values()).sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
      },

      getFilteredEntries: (filter) => {
        return get()
          .entries.filter((e) => isVisible(e) && matchesFilter(e, filter))
          .sort(
            (a, b) =>
              new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          );
      },

      getVisibleEntries: () => {
        return get()
          .entries.filter(isVisible)
          .sort(
            (a, b) =>
              new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          );
      },

      getPinnedEntries: () => {
        return get()
          .entries.filter((e) => isVisible(e) && e.isPinned)
          .sort(
            (a, b) =>
              new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          );
      },

      getRecentEntries: (limit = 3) => {
        return get().getVisibleEntries().slice(0, limit);
      },

      getThrowbackEntries: () => {
        const today = new Date();
        const throwbackIntervals = [1, 3, 6, 12]; // months ago
        const results: JournalEntry[] = [];

        for (const monthsAgo of throwbackIntervals) {
          const targetDate = new Date(today);
          targetDate.setMonth(targetDate.getMonth() - monthsAgo);
          const targetISO = targetDate.toISOString().split("T")[0]!;

          // Look for entries within ±2 days of the target date
          const targetMs = targetDate.getTime();
          const rangeMs = 2 * 24 * 60 * 60 * 1000;

          const match = get()
            .entries.filter((e) => {
              if (!isVisible(e)) return false;
              const entryMs = new Date(e.entryDate).getTime();
              return Math.abs(entryMs - targetMs) <= rangeMs;
            })
            // Prefer photo entries for throwbacks
            .sort((a, b) => {
              if (a.photoUris.length > 0 && b.photoUris.length === 0) return -1;
              if (b.photoUris.length > 0 && a.photoUris.length === 0) return 1;
              return (
                Math.abs(new Date(a.entryDate).getTime() - targetMs) -
                Math.abs(new Date(b.entryDate).getTime() - targetMs)
              );
            })[0];

          if (match) {
            results.push(match);
          }
        }

        return results;
      },

      getEntryCount: () => {
        return get().entries.filter(isVisible).length;
      },

      getPhotoCount: () => {
        return get()
          .entries.filter(isVisible)
          .reduce((sum, e) => sum + e.photoUris.length, 0);
      },

      hasAutoEntry: (referenceType, referenceId) => {
        return get().entries.some(
          (e) =>
            e.source === "system" &&
            e.referenceType === referenceType &&
            e.referenceId === referenceId &&
            !e.isDeleted
        );
      },

      resetJournal: () => {
        set({ entries: [] });
      },
    }),
    {
      name: "puppal-journal",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
