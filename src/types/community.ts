/**
 * Community Types — PRD-15
 *
 * P3 post-launch feature. Types defined now for screen scaffolding.
 * Full implementation requires Supabase tables + moderation pipeline.
 */

export type PostType = 'win' | 'question' | 'photo' | 'milestone';

export type PostCategory =
  | 'potty'
  | 'biting'
  | 'obedience'
  | 'health'
  | 'socialization'
  | 'behavior'
  | 'tricks'
  | 'general';

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;        // Display name (e.g., "Luna's Mom")
  authorBreed: string | null;
  authorPlanWeek: number | null;
  type: PostType;
  category?: PostCategory;
  content: string;
  photoUrl: string | null;
  achievementId?: string;     // Linked achievement if milestone post
  likes: number;
  commentCount: number;
  isLikedByUser: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  isBuddyResponse: boolean;  // Buddy's AI-generated answer (PRD-15 §2)
  likes: number;
  createdAt: string;
}

export type FeedFilter = 'all' | 'wins' | 'questions' | 'photos' | 'my_breed';
