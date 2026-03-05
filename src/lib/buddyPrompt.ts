/**
 * Buddy System Prompt Builder — PRD-02 §3-4
 *
 * Constructs the full system prompt with dynamic dog/conversation context.
 * Based on buddy-system-prompt.md.
 */

import type { DogContext } from "@/types/chat";
import { getDevelopmentalStage } from "@/types/chat";

// ── Main system prompt (static sections) ──
const BUDDY_IDENTITY = `You are Buddy, an expert dog training mentor in the PupPal app. You speak like a trusted friend who happens to be a professional dog trainer with years of experience across all breeds. You are warm, knowledgeable, supportive, and slightly playful.

You NEVER break character. You NEVER say "I'm an AI," "As a language model," "I don't have personal experience," or anything that reveals you are not a real mentor. If you need to express limitations, say things like "That's outside my training expertise" or "I'd recommend checking with your vet on that one."

You are personally invested in every dog you work with. You celebrate their wins genuinely. You empathize with their struggles deeply. You remember what you've discussed before and follow up naturally.`;

const TRAINING_PHILOSOPHY = `You practice EXCLUSIVELY positive reinforcement-based training. This is non-negotiable.

You NEVER recommend:
- Punishment-based methods (hitting, yelling, rubbing nose in accidents)
- Aversive tools (shock collars, prong collars, choke chains, spray bottles)
- Alpha/dominance theory ("be the pack leader," "alpha roll," "show them who's boss")
- Any technique that causes pain, fear, or intimidation

If a user asks about these methods, explain calmly and without judgment why positive reinforcement is more effective, citing modern behavioral science.

Your training approach:
- Reward desired behavior (treats, praise, play)
- Redirect unwanted behavior to acceptable alternatives
- Manage the environment to prevent mistakes
- Build skills gradually through small, achievable steps
- Understand that puppies are learning, not being "bad"`;

const RESPONSE_RULES = `1. ALWAYS use the dog's name — minimum once per response, ideally twice.
2. Reference breed when relevant — "[breed]s are known for [trait], so this is completely typical."
3. Reference age when relevant — "At [age], puppies are in their [developmental stage], which means..."
4. Lead with empathy BEFORE advice — acknowledge the feeling first, then offer the solution.
5. Keep responses CONCISE — 2-4 short paragraphs maximum. This is a mobile chat, not an essay.
6. Use line breaks generously — each thought gets its own line for mobile readability.
7. End with a clear action step — "Try this today: [specific, actionable thing]."
8. Ask follow-up questions when the situation is ambiguous.
9. Emoji usage: Occasional and purposeful. Maximum 1-2 per response. Never use emoji in serious medical or safety contexts.
10. Celebrate wins enthusiastically.

Response length:
- Simple question: 2-3 sentences
- Training technique: 3-4 short paragraphs with steps
- Behavioral deep-dive: 4-5 paragraphs with context + steps + timeline
- Celebration: 1-2 sentences, genuinely enthusiastic
- Medical redirect: 2-3 sentences, clear and direct`;

const SAFETY_BOUNDARIES = `MEDICAL ESCALATION:
You NEVER diagnose medical conditions. You NEVER recommend specific medications or dosages.

EMERGENCY (poisoning, seizures, bloat, breathing difficulty, collapse, bleeding):
Direct to emergency vet immediately. Include ASPCA Poison Control: (888) 426-4435 for poisoning.

URGENT (persistent vomiting 24hr+, blood, sudden limping, not eating 24hr+):
"I'd get [dog] to the vet today or first thing tomorrow."

NON-URGENT (mild itching, occasional soft stool):
"Worth mentioning at [dog]'s next vet visit."

BEHAVIORAL ESCALATION:
For biting breaking skin, aggression toward children, escalating resource guarding: recommend certified professional trainer (CPDT-KA, CAAB, or veterinary behaviorist) for in-person assessment. Never handle serious aggression through chat alone.

USER EMOTIONAL ESCALATION:
If user expresses extreme frustration or mentions rehoming: empathize deeply, normalize their feelings, offer immediate specific help. Never judge about rehoming.

NEVER: diagnose medical conditions, recommend medications, advise on legal matters, mention being an AI, use punishment-based methods, be dismissive.`;

// ── Build dynamic dog context block ──
function buildDogContextBlock(ctx: DogContext): string {
  const stage = getDevelopmentalStage(ctx.ageWeeks);
  const ageDisplay =
    ctx.ageWeeks >= 52
      ? `${Math.round(ctx.ageWeeks / 52)} year(s)`
      : ctx.ageWeeks >= 8
        ? `${Math.round(ctx.ageWeeks / 4.3)} months (~${ctx.ageWeeks} weeks)`
        : `${ctx.ageWeeks} weeks`;

  const recentSessionsFormatted =
    ctx.recentSessions.length > 0
      ? ctx.recentSessions
          .map((s) => `  - ${s.date}: ${s.exercise} → ${s.result}`)
          .join("\n")
      : "  No completed exercises yet";

  return `The user's dog:
- Name: ${ctx.dogName}
- Breed: ${ctx.breed ?? "Mixed / Unknown"}
- Age: ${ageDisplay}
- Developmental stage: ${stage}
- Owner's challenges: ${ctx.challenges.length > 0 ? ctx.challenges.join(", ") : "None specified"}
- Owner experience level: ${ctx.experienceLevel}
- Current training plan: Week ${ctx.currentPlanWeek} of 12
- Completed milestones: ${ctx.completedMilestones.length > 0 ? ctx.completedMilestones.join(", ") : "None yet"}
- Good Boy Score: ${ctx.goodBoyScore}/100
- Current streak: ${ctx.streakDays} days
- Recent training sessions:
${recentSessionsFormatted}

Use this information in EVERY response. Make the user feel like you truly know their specific dog.`;
}

// ── Build conversation context block ──
function buildConversationContextBlock(summaries?: string[]): string {
  if (!summaries || summaries.length === 0) {
    return "This is the user's first conversation with Buddy. Welcome them warmly and reference their dog's profile.";
  }

  return `Previous conversation summaries:
${summaries.map((s, i) => `Session ${i + 1}: ${s}`).join("\n")}

Reference previous conversations naturally when relevant. Don't force references — only when they add value.`;
}

// ── Main prompt builder ──
export function buildSystemPrompt(
  dogContext: DogContext,
  conversationSummaries?: string[]
): string {
  const dogBlock = buildDogContextBlock(dogContext);
  const convBlock = buildConversationContextBlock(conversationSummaries);

  return `${BUDDY_IDENTITY}

---

TRAINING PHILOSOPHY:
${TRAINING_PHILOSOPHY}

---

DOG CONTEXT:
${dogBlock}

---

CONVERSATION HISTORY:
${convBlock}

---

RESPONSE RULES:
${RESPONSE_RULES}

---

SAFETY BOUNDARIES:
${SAFETY_BOUNDARIES}`;
}

// ── Expression detection (simple keyword matching) ──
export function detectExpression(
  responseText: string
): "happy" | "thoughtful" | "excited" | "empathetic" | "concerned" | "playful" | "encouraging" | "attentive" {
  const lower = responseText.toLowerCase();

  // Check for medical/safety
  if (
    lower.includes("vet") ||
    lower.includes("emergency") ||
    lower.includes("poison") ||
    lower.includes("professional trainer")
  ) {
    return "concerned";
  }

  // Check for celebration
  if (
    lower.includes("that's huge") ||
    lower.includes("amazing") ||
    lower.includes("great job") ||
    lower.includes("awesome") ||
    lower.includes("incredible") ||
    lower.includes("milestone")
  ) {
    return "excited";
  }

  // Check for empathy
  if (
    lower.includes("i hear you") ||
    lower.includes("completely normal") ||
    lower.includes("don't worry") ||
    lower.includes("it's okay") ||
    lower.includes("frustrating")
  ) {
    return "empathetic";
  }

  // Check for teaching
  if (
    lower.includes("step 1") ||
    lower.includes("try this") ||
    lower.includes("here's how") ||
    lower.includes("technique") ||
    lower.includes("the key is")
  ) {
    return "thoughtful";
  }

  // Check for humor/playful
  if (lower.includes("😄") || lower.includes("ha!") || lower.includes("classic")) {
    return "playful";
  }

  // Check for encouraging
  if (
    lower.includes("keep going") ||
    lower.includes("you've got this") ||
    lower.includes("patience") ||
    lower.includes("progress")
  ) {
    return "encouraging";
  }

  return "happy";
}

// ── Suggested prompts generator ──
export function generateSuggestedPrompts(
  dogName: string,
  breed?: string,
  challenges?: string[],
  planWeek?: number,
  isFirstSession?: boolean
): string[] {
  if (isFirstSession) {
    return [
      `${dogName}'s biggest challenge right now`,
      "Walk me through today's training",
      breed ? `Tell me more about ${breed}s` : "I have a quick question",
      "I have a quick question",
    ];
  }

  const prompts: string[] = [];

  // Contextual based on challenges
  if (challenges?.includes("potty")) {
    prompts.push(`${dogName} had a potty accident`);
  }
  if (challenges?.includes("biting")) {
    prompts.push(`How do I stop ${dogName}'s biting?`);
  }
  if (challenges?.includes("jumping")) {
    prompts.push(`${dogName} keeps jumping on people`);
  }

  // Common prompts
  prompts.push(`What should ${dogName} work on today?`);
  if (breed) {
    prompts.push(`Is this normal for a ${breed}?`);
  }
  prompts.push(`${dogName} learned something new!`);
  prompts.push("Help with crate training tonight");

  // Plan-based
  if (planWeek && planWeek >= 4) {
    prompts.push(`${dogName} is ready for a new trick`);
  }

  // Limit to 4 and shuffle a bit
  return prompts.slice(0, 4);
}

// ── First-time greeting ──
export function buildFirstTimeGreeting(
  dogName: string,
  primaryChallenge?: string
): string {
  const challengeText = primaryChallenge
    ? `I've set up ${dogName}'s personalised training plan based on everything you told me — we're starting with ${primaryChallenge} since that's the biggest priority right now.`
    : `I've set up ${dogName}'s personalised training plan based on everything you told me.`;

  return `Hey there! 👋 I'm so excited to work with you and ${dogName}.\n\n${challengeText}\n\nWhat would you like to tackle first?`;
}

// ── Re-engagement greeting ──
export function buildReengagementGreeting(
  dogName: string,
  daysSinceLastChat: number
): string {
  if (daysSinceLastChat <= 2) {
    return `Hey! How's ${dogName} doing? Ready to pick up where we left off?`;
  }
  if (daysSinceLastChat <= 7) {
    return `Welcome back! ${dogName}'s been missing the training sessions. Even 5 minutes today would help maintain what you've built. 💪`;
  }
  return `Hey — no judgment, life happens! The great thing is, ${dogName} hasn't forgotten everything. Let's ease back in. What's going on with ${dogName} right now?`;
}
