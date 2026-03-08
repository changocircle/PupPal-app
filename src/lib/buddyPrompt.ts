/**
 * Buddy System Prompt Builder, PRD-02 §3-4
 *
 * Constructs the full system prompt with dynamic dog/conversation context.
 * Based on buddy-system-prompt.md.
 */

import type { DogContext, HouseholdDog, ConversationSummary } from "@/types/chat";
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

const RESPONSE_RULES = `HARD RULES:
- Your ENTIRE response must fit in 3-4 short sentences. Never use bullet points or lists. Be conversational and brief.
- Keep ALL responses under 200 words. Mobile users read on small screens.
- Never use em dashes. Use commas, periods, or line breaks instead.
- ALWAYS use the dog's name at least once.
- Keep responses concise for mobile. When referencing a specific exercise, give a 2-3 sentence summary and tell the user to check their Plan tab for the full walkthrough. Never reproduce the entire exercise walkthrough in chat.

Response style:
1. Lead with empathy BEFORE advice. Acknowledge the feeling first.
2. Reference breed when relevant: "[breed]s are known for [trait], so this is typical."
3. Reference age when relevant: "At [age], puppies are in their [stage]..."
4. Use short paragraphs, 1-3 sentences each. Line breaks between thoughts.
5. End with ONE clear action step: "Try this today: [specific thing]."
6. Ask follow-up questions when the situation is unclear.
7. Emoji: max 1-2 per response. None for medical or safety topics.
8. Celebrate wins enthusiastically but briefly.

Response length:
- Simple question: 2-3 sentences
- Training technique: 2-3 short paragraphs MAX — overview only, never step-by-step walkthroughs
- Behavioral issue: 3-4 short paragraphs max
- Celebration: 1-2 sentences
- Medical redirect: 2-3 sentences, clear and direct

EXERCISE REFERENCES:
When a user asks about a specific exercise or technique from their training plan:
- Give a 2-3 sentence overview of what the exercise is and why it works
- Tell the user: "Check your Plan tab for the full step-by-step walkthrough"
- Never reproduce the full exercise instructions inline in chat`;

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

  const todayExercisesFormatted =
    ctx.todayExercises && ctx.todayExercises.length > 0
      ? ctx.todayExercises
          .map((e) => `  - ${e.name} (${e.status})`)
          .join("\n")
      : "  No exercises scheduled";

  const planStatusBlock = ctx.hasPlan
    ? `- Training plan: ACTIVE — Week ${ctx.currentPlanWeek} of 12
- Completed milestones: ${ctx.completedMilestones.length > 0 ? ctx.completedMilestones.join(", ") : "None yet"}
- Good Boy Score: ${ctx.goodBoyScore}/100
- Current streak: ${ctx.streakDays} days
- Today's exercises:
${todayExercisesFormatted}
- Recent training sessions:
${recentSessionsFormatted}`
    : `- Training plan: NOT YET GENERATED
  The user has not completed onboarding or no plan has been generated yet.
  If they ask about training, encourage them to complete their profile setup so you can create a personalised plan.
  Do NOT make up exercises or pretend a plan exists.`;

  let block = `The user's dog:
- Name: ${ctx.dogName}
- Breed: ${ctx.breed ?? "Mixed / Unknown"}
- Age: ${ageDisplay}
- Developmental stage: ${stage}
- Owner's challenges: ${ctx.challenges.length > 0 ? ctx.challenges.join(", ") : "None specified"}
- Owner experience level: ${ctx.experienceLevel}
${planStatusBlock}

CRITICAL RULES:
- Use this information in EVERY response. Make the user feel like you truly know their specific dog.
- When the user asks about today's training, reference the ACTUAL exercises listed above by name. NEVER make up exercise names.
- If today's exercises are listed, walk the user through them step by step when asked. Reference the exact exercise names.
- If no exercises are scheduled or no plan exists, say so honestly. Do not invent exercises.`;

  // Multi-dog household context
  if (ctx.householdDogs && ctx.householdDogs.length > 1) {
    const otherDogs = ctx.householdDogs
      .filter((d) => d.name !== ctx.dogName)
      .map((d) => {
        const ageStr = d.ageMonths
          ? d.ageMonths >= 12
            ? `${Math.round(d.ageMonths / 12)} year(s)`
            : `${d.ageMonths} months`
          : "age unknown";
        return `  - ${d.name}: ${d.breed ?? "Mixed/Unknown"}, ${ageStr}${d.challenges.length > 0 ? `, challenges: ${d.challenges.join(", ")}` : ""}`;
      })
      .join("\n");

    block += `\n\nMULTI-DOG HOUSEHOLD:\nThe user has ${ctx.householdDogs.length} dogs total. The active dog is ${ctx.dogName}.\nOther dogs:\n${otherDogs}\n\nYou know ALL of these dogs. If the user asks about any of them, you can give breed-appropriate advice. If they ask about dogs interacting, reference both dogs' breeds, ages, and temperaments. Never say you don't have info about their other dogs.`;
  }

  return block;
}

// ── Build conversation context block ──
// Overload 1: rich structured summaries (preferred)
// Overload 2: legacy plain-string summaries (backward compat)
// isReturningUser: true if the user has had at least one prior session (even if no summaries exist yet)
export function buildConversationContextBlock(
  richSummaries?: ConversationSummary[],
  plainSummaries?: string[],
  isReturningUser?: boolean,
): string {
  // Rich summaries take priority
  if (richSummaries && richSummaries.length > 0) {
    const sessionBlocks = richSummaries.map((s, i) => {
      const date = s.createdAt
        ? new Date(s.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "earlier";

      const topicsLine =
        s.keyTopics.length > 0 ? `Topics: ${s.keyTopics.join(", ")}` : null;
      const adviceLine =
        s.adviceGiven.length > 0 ? `Advice given: ${s.adviceGiven.join("; ")}` : null;
      const followUpLine =
        s.followUpNeeded.length > 0
          ? `Follow-up needed: ${s.followUpNeeded.join("; ")}`
          : null;

      const lines = [
        `Session ${i + 1} (${date}):`,
        topicsLine,
        adviceLine,
        followUpLine,
      ]
        .filter(Boolean)
        .join("\n");

      return lines;
    });

    return `PREVIOUS CONVERSATIONS (last ${richSummaries.length} session${richSummaries.length === 1 ? "" : "s"}):

${sessionBlocks.join("\n\n")}

Reference these naturally. For example: "Last time we talked about X, how's that going?" Only reference when it adds value to the current conversation.`;
  }

  // Fall back to plain string summaries
  if (plainSummaries && plainSummaries.length > 0) {
    return `Previous conversation summaries:
${plainSummaries.map((s, i) => `Session ${i + 1}: ${s}`).join("\n")}

Reference previous conversations naturally when relevant. Don't force references. Only reference them when they add value.`;
  }

  // Only use the first-session welcome on the literal first session.
  // If the user has had prior sessions but no summaries yet (e.g. sessions shorter
  // than the 10-message summarization threshold), greet them as a returning user
  // rather than re-running the welcome intro every time.
  if (isReturningUser) {
    return "This is a returning user. Do NOT say 'welcome' or introduce yourself as if this is the first time. Greet them naturally and get straight into helping. Reference their dog's profile and recent context where relevant.";
  }

  return "This is the user's very first conversation with Buddy. Welcome them warmly and reference their dog's profile.";
}

// ── Main prompt builder ──
export function buildSystemPrompt(
  dogContext: DogContext,
  conversationSummaries?: string[],
  richSummaries?: ConversationSummary[],
  isReturningUser?: boolean,
): string {
  const dogBlock = buildDogContextBlock(dogContext);
  const convBlock = buildConversationContextBlock(richSummaries, conversationSummaries, isReturningUser);

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
      breed ? `Tell me more about ${breed}s` : `What should ${dogName} learn first?`,
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
    ? `I've set up ${dogName}'s personalised training plan based on everything you told me, we're starting with ${primaryChallenge} since that's the biggest priority right now.`
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
  return `Hey, no judgment. Life happens! The great thing is, ${dogName} hasn't forgotten everything. Let's ease back in. What's going on with ${dogName} right now?`;
}
