/**
 * Referral Store — PRD-08
 *
 * Manages referral codes, sharing, and tracking.
 * In production: referral credits applied via Supabase Edge Functions.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nanoid } from 'nanoid/non-secure';

export interface Referral {
  id: string;
  code: string;
  referredUserId: string;
  referredUserName: string;
  status: 'installed' | 'trial_started' | 'converted';
  xpEarned: number;
  createdAt: string;
  convertedAt?: string;
}

export interface ReferralState {
  // User's own referral code
  referralCode: string;
  customCode: string | null; // vanity code

  // Incoming referral (if user was referred by someone)
  referredByCode: string | null;

  // Referral tracking
  referrals: Referral[];
  totalReferrals: number;
  totalXpFromReferrals: number;
  totalSharesSent: number;

  // Actions
  initializeCode: () => void;
  setCustomCode: (code: string) => boolean;
  setReferredByCode: (code: string) => void;
  addReferral: (referral: Omit<Referral, 'id' | 'createdAt'>) => void;
  updateReferralStatus: (referralId: string, status: Referral['status'], xp?: number) => void;
  incrementShareCount: () => void;
  getReferralLink: () => string;
  getShareMessage: (dogName: string) => string;

  /** Reset all referral data (call on sign-out) */
  resetReferral: () => void;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCode: '',
      customCode: null,
      referredByCode: null,
      referrals: [],
      totalReferrals: 0,
      totalXpFromReferrals: 0,
      totalSharesSent: 0,

      initializeCode: () => {
        const { referralCode } = get();
        if (referralCode) return; // Already initialized

        // Generate 8-char alphanumeric code (PRD-08 §2)
        const code = nanoid(8).toUpperCase();
        set({ referralCode: code });
      },

      setCustomCode: (code: string) => {
        const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (normalized.length < 3 || normalized.length > 20) return false;

        // In production: validate uniqueness via Supabase
        set({ customCode: normalized });
        return true;
      },

      setReferredByCode: (code: string) => {
        set({ referredByCode: code.toUpperCase() });
      },

      addReferral: (referral) => {
        const id = nanoid(12);
        const newReferral: Referral = {
          ...referral,
          id,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          referrals: [...s.referrals, newReferral],
          totalReferrals: s.totalReferrals + 1,
          totalXpFromReferrals: s.totalXpFromReferrals + referral.xpEarned,
        }));
      },

      updateReferralStatus: (referralId, status, xp = 0) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === referralId
              ? {
                  ...r,
                  status,
                  xpEarned: r.xpEarned + xp,
                  ...(status === 'converted' ? { convertedAt: new Date().toISOString() } : {}),
                }
              : r
          ),
          totalXpFromReferrals: s.totalXpFromReferrals + xp,
        }));
      },

      incrementShareCount: () => {
        set((s) => ({ totalSharesSent: s.totalSharesSent + 1 }));
      },

      getReferralLink: () => {
        const { customCode, referralCode } = get();
        const code = customCode ?? referralCode;
        return `https://puppal.dog/r/${code}`;
      },

      getShareMessage: (dogName: string) => {
        const link = get().getReferralLink();
        return `🐾 I've been training ${dogName} with PupPal and it's amazing! Join us — ${link}`;
      },

      resetReferral: () => {
        set({
          referralCode: '',
          customCode: null,
          referredByCode: null,
          referrals: [],
          totalReferrals: 0,
          totalXpFromReferrals: 0,
          totalSharesSent: 0,
        });
      },
    }),
    {
      name: 'puppal-referral',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
