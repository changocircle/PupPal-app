/**
 * Sharing Utilities — PRD-08 §3
 *
 * Generate shareable content for achievements, milestones, streaks,
 * and trick completions. Every share is a branded PupPal moment.
 */

import { Share, Platform } from 'react-native';
import { analytics, EVENTS } from '@/services/analytics';

export type ShareableContent =
  | 'achievement'
  | 'streak'
  | 'level_up'
  | 'trick_learned'
  | 'gbs_milestone'
  | 'plan_graduation'
  | 'weight_milestone'
  | 'referral';

interface ShareData {
  type: ShareableContent;
  dogName: string;
  title: string;
  detail?: string;
  value?: number;
  referralCode?: string;
}

/**
 * Generate a share message with PupPal branding.
 */
function generateShareMessage(data: ShareData): string {
  const appLink = data.referralCode
    ? `https://puppal.dog/r/${data.referralCode}`
    : 'https://puppal.dog';

  switch (data.type) {
    case 'achievement':
      return `🏆 ${data.dogName} just unlocked "${data.title}"! ${data.detail ?? ''}\n\nTraining with PupPal → ${appLink}`;

    case 'streak':
      return `🔥 ${data.dogName} is on a ${data.value}-day training streak! Consistency is key 💪\n\nTrain your pup → ${appLink}`;

    case 'level_up':
      return `⬆️ ${data.dogName} leveled up to Level ${data.value}! ${data.title}\n\nStart your journey → ${appLink}`;

    case 'trick_learned':
      return `🎯 ${data.dogName} just learned "${data.title}"! 🐾\n\nTeach your pup tricks → ${appLink}`;

    case 'gbs_milestone':
      return `⭐ ${data.dogName}'s Good Boy Score: ${data.value}! ${data.detail ?? ''}\n\nTrack your pup's progress → ${appLink}`;

    case 'plan_graduation':
      return `🎓 ${data.dogName} graduated from their training plan! So proud! 🎉\n\nStart training → ${appLink}`;

    case 'weight_milestone':
      return `📏 ${data.dogName} hit ${data.value} lbs! Growing up so fast 🐶\n\nTrack your pup → ${appLink}`;

    case 'referral':
      return `🐾 I've been training ${data.dogName} with PupPal and it's amazing!\n\nJoin us → ${appLink}`;

    default:
      return `🐾 Check out ${data.dogName}'s progress on PupPal! → ${appLink}`;
  }
}

/**
 * Share content via native share sheet.
 *
 * Returns true if shared successfully, false if cancelled.
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  try {
    const message = generateShareMessage(data);

    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message }
        : { message, title: `${data.dogName} on PupPal` }
    );

    if (result.action === Share.sharedAction) {
      analytics.track(EVENTS.SHARE_COMPLETED, {
        type: data.type,
        method: result.activityType ?? 'unknown',
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Sharing] Share failed:', error);
    return false;
  }
}

/**
 * Quick share helpers.
 */
export const shareAchievement = (dogName: string, title: string, description?: string, referralCode?: string) =>
  shareContent({ type: 'achievement', dogName, title, detail: description, referralCode });

export const shareStreak = (dogName: string, days: number, referralCode?: string) =>
  shareContent({ type: 'streak', dogName, title: `${days}-day streak`, value: days, referralCode });

export const shareLevelUp = (dogName: string, level: number, title: string, referralCode?: string) =>
  shareContent({ type: 'level_up', dogName, title, value: level, referralCode });

export const shareTrick = (dogName: string, trickName: string, referralCode?: string) =>
  shareContent({ type: 'trick_learned', dogName, title: trickName, referralCode });

export const shareGBS = (dogName: string, score: number, detail?: string, referralCode?: string) =>
  shareContent({ type: 'gbs_milestone', dogName, title: 'Good Boy Score', value: score, detail, referralCode });
