/**
 * useChat Hook, PRD-02 §10
 *
 * Handles sending messages, streaming responses, context injection.
 *
 * When Supabase URL + anon key are set → calls the buddy-chat Edge Function,
 * which proxies to Claude Sonnet 4.6 server-side (API key stays on server).
 * When not configured → falls back to smart mock responses for development.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useTrainingStore } from "@/stores/trainingStore";
import { useDogStore } from "@/stores/dogStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSubscription } from "@/hooks/useSubscription";
import { getExerciseById } from "@/data/exerciseData";
import {
  buildSystemPrompt,
  generateSuggestedPrompts,
  detectExpression,
} from "@/lib/buddyPrompt";
import {
  isAIProviderAvailable,
  streamChatCompletion,
} from "@/lib/aiProvider";
import { generateSessionSummary } from "@/services/conversationSummarizer";
import type { AIMessage } from "@/lib/aiProvider";
import type { DogContext, BuddyExpression, ChatMessage } from "@/types/chat";
import { MAX_MESSAGES_IN_CONTEXT } from "@/types/chat";

interface UseChatReturn {
  // State
  messages: ChatMessage[];
  isStreaming: boolean;
  canSend: boolean;
  remainingMessages: number;
  suggestedPrompts: string[];
  buddyExpression: BuddyExpression;
  isLiveAI: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendSuggestedPrompt: (text: string) => Promise<void>;
  setFeedback: (messageId: string, feedback: "positive" | "negative") => void;
  startNewSession: () => void;
  clearChat: () => void;
}

export function useChat(): UseChatReturn {
  const { isPremium } = useSubscription();
  // Individual selectors → stable refs, prevents render loops
  const activeDogId = useDogStore((s) => s.activeDogId);
  const dogs = useDogStore((s) => s.dogs);
  const dog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );
  const onboarding = useOnboardingStore((s) => s.data);
  const plan = useTrainingStore((s) => s.plan);
  const streak = useTrainingStore((s) => s.streak);
  const completions = useTrainingStore((s) => s.completions);
  const totalXp = useTrainingStore((s) => s.totalXp);
  const getTodayExercises = useTrainingStore((s) => s.getTodayExercises);

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const canSendMessage = useChatStore((s) => s.canSendMessage);
  const getRemainingMessages = useChatStore((s) => s.getRemainingMessages);
  const startSession = useChatStore((s) => s.startSession);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const updateStreamingContent = useChatStore((s) => s.updateStreamingContent);
  const finishStreaming = useChatStore((s) => s.finishStreaming);
  const setFeedbackAction = useChatStore((s) => s.setFeedback);
  const incrementDailyCount = useChatStore((s) => s.incrementDailyCount);
  const clearConversation = useChatStore((s) => s.clearConversation);
  const getRecentSummaries = useChatStore((s) => s.getRecentSummaries);
  const addRichSummary = useChatStore((s) => s.addRichSummary);
  const addConversationSummary = useChatStore((s) => s.addConversationSummary);
  const getRecentRichSummaries = useChatStore((s) => s.getRecentRichSummaries);
  const isSessionExpired = useChatStore((s) => s.isSessionExpired);

  const buddyExpressionRef = useRef<BuddyExpression>("happy");
  // Track the previous activeDogId so we can detect a dog switch
  const prevActiveDogIdRef = useRef<string | null | undefined>(activeDogId);

  // Build dog context for system prompt
  const dogName = dog?.name ?? onboarding.puppyName ?? "Your Pup";
  const breed = dog?.breed ?? onboarding.breed;
  const ageMonths = dog?.age_months_at_creation ?? dog?.age_months ?? onboarding.ageMonths;

  // Build household dogs list for multi-dog awareness
  const householdDogs = dogs
    .filter((d) => !d.archived_at)
    .map((d) => ({
      name: d.name,
      breed: d.breed,
      ageMonths: d.age_months_at_creation ?? d.age_months ?? null,
      challenges: d.challenges ?? [],
      isActive: d.id === activeDogId,
    }));

  // Helper: resolve exercise name from exerciseId via exercise library
  const resolveExerciseName = useCallback((exerciseId: string): string => {
    const exercise = getExerciseById(exerciseId);
    return exercise?.title ?? "Exercise";
  }, []);

  // Build recent sessions from completion history (last 5)
  const recentSessions = useMemo(() => {
    const sorted = [...completions]
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 5);

    return sorted.map((c) => {
      // Find the PlanExercise to get exerciseId, then look up title from library
      let exerciseName = "Exercise";
      if (plan) {
        for (const week of plan.weeks) {
          for (const day of week.days) {
            const planEx = day.exercises.find((e) => e.id === c.planExerciseId);
            if (planEx) {
              exerciseName = resolveExerciseName(planEx.exerciseId);
              break;
            }
          }
        }
      }
      const rating = c.rating ? ` (rated ${c.rating}/5)` : "";
      return {
        date: c.completedAt.split("T")[0],
        exercise: exerciseName,
        result: `Completed${rating}, +${c.xpEarned} XP`,
      };
    });
  }, [completions, plan, resolveExerciseName]);

  // Build completed milestones from plan weeks
  const completedMilestones = useMemo(() => {
    if (!plan) return [];
    const milestones: string[] = [];
    for (const week of plan.weeks) {
      if (week.weekNumber >= (plan.currentWeek ?? 1)) break;
      const allDone = week.days.every((d) =>
        d.exercises.every((e) => e.status === "completed" || e.status === "skipped"),
      );
      if (allDone) {
        milestones.push(`Week ${week.weekNumber} complete`);
      }
    }
    return milestones;
  }, [plan]);

  // Build today's exercises for context — resolve names from exercise library
  const todayExerciseNames = useMemo(() => {
    const exercises = getTodayExercises();
    if (exercises.length === 0 && plan) {
      console.log(
        `[useChat] todayExercises empty. plan.currentWeek=${plan.currentWeek}, ` +
          `plan.currentDay=${plan.currentDay}, weeks=${plan.weeks.length}`,
      );
    }
    return exercises.map((e) => ({
      name: resolveExerciseName(e.exerciseId),
      status: e.status,
      category: getExerciseById(e.exerciseId)?.category ?? "basic_commands",
    }));
  }, [getTodayExercises, plan, resolveExerciseName]);

  const dogContext: DogContext = {
    dogName,
    breed: breed ?? undefined,
    ageWeeks: ageMonths
      ? Math.round(ageMonths * 4.3)
      : 12,
    developmentalStage: "",
    challenges: dog?.challenges ?? onboarding.challenges ?? [],
    experienceLevel: (dog?.owner_experience as any) ?? onboarding.ownerExperience ?? "first_time",
    currentPlanWeek: plan?.currentWeek ?? 1,
    hasPlan: plan !== null,
    completedMilestones,
    goodBoyScore: Math.min(100, Math.round(totalXp / 5)),
    streakDays: streak,
    recentSessions,
    todayExercises: todayExerciseNames,
    householdDogs: householdDogs.length > 1 ? householdDogs : undefined,
  };

  // Debug log: training context being sent to system prompt
  // Wrapped in useEffect so it only fires when context data actually changes,
  // not on every render (fixes [useChat] Training context log spam).
  useEffect(() => {
    console.log(
      "[useChat] Training context:",
      JSON.stringify({
        hasPlan: plan !== null,
        currentWeek: plan?.currentWeek,
        currentDay: plan?.currentDay,
        todayExercises: todayExerciseNames.length,
        todayExerciseNames: todayExerciseNames.map((e) => e.name),
        completedMilestones: completedMilestones.length,
        recentSessions: recentSessions.length,
        totalXp,
        streak,
      }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plan,
    todayExerciseNames,
    completedMilestones,
    recentSessions,
    totalXp,
    streak,
  ]);

  const canSend = canSendMessage(isPremium) && !isStreaming;
  const remainingMessages = getRemainingMessages(isPremium);
  const isLiveAI = isAIProviderAvailable();

  // ── Dog-switch: reload rich summaries for the newly active dog ──
  useEffect(() => {
    if (prevActiveDogIdRef.current !== activeDogId) {
      prevActiveDogIdRef.current = activeDogId;
      if (activeDogId) {
        // Prefetch the new dog's summaries so they are ready when the
        // system prompt is next built. getRecentRichSummaries is a selector
        // (no side effects) — calling it here is just for logging visibility.
        const dogSummaries = getRecentRichSummaries(activeDogId, 5);
        console.log(
          `[useChat] Dog switched to ${activeDogId} — ${dogSummaries.length} rich summaries available`,
        );
      }
    }
  }, [activeDogId, getRecentRichSummaries]);

  // Rich summaries for the active dog (used to build system prompt)
  const richSummaries = activeDogId
    ? getRecentRichSummaries(activeDogId, 5)
    : [];

  // Current session messages
  const sessionMessages = currentSessionId
    ? messages.filter((m) => m.sessionId === currentSessionId)
    : [];

  // Suggested prompts — dynamic (from AI) preferred, static fallback
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const isFirstSession = messages.length === 0;
  const staticPrompts = generateSuggestedPrompts(
    dogName,
    breed ?? undefined,
    onboarding.challenges,
    plan?.currentWeek,
    isFirstSession
  );
  // Use dynamic suggestions if available, fall back to static
  const suggestedPrompts = dynamicSuggestions.length > 0
    ? dynamicSuggestions
    : staticPrompts;

  // ── Send message ──
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;
      if (!canSendMessage(isPremium)) return;

      // Ensure session is active
      let sessionId = currentSessionId;
      if (!sessionId || isSessionExpired()) {
        sessionId = startSession(dog?.id ?? "local");
      }

      // Add user message
      const userMsg = addUserMessage(content.trim());
      if (!userMsg) return;

      // Increment daily count for free users
      if (!isPremium) {
        incrementDailyCount();
      }

      // Build system prompt with full dog context + conversation memory
      // Prefer rich structured summaries; fall back to plain strings if none exist
      const currentRichSummaries = activeDogId
        ? getRecentRichSummaries(activeDogId, 5)
        : [];
      const plainSummaries = currentRichSummaries.length === 0
        ? getRecentSummaries(3)
        : [];
      // A user is "returning" if they have at least one completed prior session
      // (sessions persists across app restarts). This prevents Buddy from saying
      // "Hey, welcome to PupPal!" on every session when summaries haven't fired yet
      // (summaries only generate after 10 messages or on session end).
      const completedSessions = useChatStore.getState().sessions.filter(
        (s) => s.endedAt !== undefined,
      );
      const isReturningUser = completedSessions.length > 0;
      const systemPrompt = buildSystemPrompt(
        dogContext,
        plainSummaries,
        currentRichSummaries.length > 0 ? currentRichSummaries : undefined,
        isReturningUser,
      );

      // Get recent messages for context window (last 20)
      // Filter out empty-content messages to prevent "Empty response from AI provider" errors.
      // This can happen if a previous assistant placeholder ("") wasn't fully cleaned up.
      const recentMsgs = useChatStore
        .getState()
        .messages.filter(
          (m) =>
            m.role !== "system" &&
            m.sessionId === sessionId &&
            m.content.trim() !== ""
        )
        .slice(-MAX_MESSAGES_IN_CONTEXT)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // Create streaming placeholder
      const assistantMsg = addAssistantMessage("");

      try {
        if (isAIProviderAvailable()) {
          // ── Real AI Provider (Claude Sonnet 4.6 via Edge Function) ──
          const result = await sendToRealAI(
            systemPrompt,
            recentMsgs,
            assistantMsg.id,
            dogName,
          );
          // Update dynamic suggestions from AI response
          if (result.suggestedPrompts.length > 0) {
            setDynamicSuggestions(result.suggestedPrompts);
          }
        } else {
          // ── Mock fallback ──
          await sendToMockAI(assistantMsg.id, dogName, content);
        }

        // ── Summarize every 10th message (fire-and-forget) ──
        const allSessionMsgs = useChatStore
          .getState()
          .messages.filter(
            (m) => m.sessionId === sessionId && m.role !== "system",
          );
        if (allSessionMsgs.length > 0 && allSessionMsgs.length % 10 === 0) {
          const snapSessionId = sessionId;
          const snapMessages = [...allSessionMsgs];
          const snapDogId = activeDogId ?? "local";
          generateSessionSummary(snapSessionId, snapMessages, dogName, snapDogId)
            .then((summary) => {
              if (summary) {
                const { addRichSummary: addRich, addConversationSummary: addPlain } =
                  useChatStore.getState();
                // Avoid duplicates by sessionId
                const existing = useChatStore.getState().richSummaries;
                const isDuplicate = existing.some(
                  (s) => s.sessionId === summary.sessionId,
                );
                if (!isDuplicate) {
                  addRich(summary);
                  addPlain(summary.summaryText);
                  console.log(
                    `[useChat] Mid-session summary stored (${allSessionMsgs.length} messages)`,
                  );
                }
              }
            })
            .catch((err) => {
              console.warn("[useChat] Mid-session summarization failed:", err);
            });
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Chat error:", errorMsg);
        updateStreamingContent(
          assistantMsg.id,
          "Sorry, I'm having a moment. Try sending that again? 🐾"
        );
        finishStreaming(assistantMsg.id);
      }
    },
    [isStreaming, isPremium, currentSessionId, dogContext, dogName, activeDogId]
  );

  const sendSuggestedPrompt = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage]
  );

  const startNewSession = useCallback(() => {
    // ── Summarize the ending session (fire-and-forget) ──
    const endingSessionId = currentSessionId;
    if (endingSessionId) {
      const endingMessages = useChatStore
        .getState()
        .messages.filter(
          (m) => m.sessionId === endingSessionId && m.role !== "system",
        );
      const endingDogId = activeDogId ?? "local";
      const endingDogName = dogName;

      generateSessionSummary(endingSessionId, endingMessages, endingDogName, endingDogId)
        .then((summary) => {
          if (summary) {
            const { addRichSummary: addRich, addConversationSummary: addPlain, richSummaries } =
              useChatStore.getState();
            const isDuplicate = richSummaries.some(
              (s) => s.sessionId === summary.sessionId,
            );
            if (!isDuplicate) {
              addRich(summary);
              addPlain(summary.summaryText);
              console.log(
                `[useChat] End-of-session summary stored for session ${endingSessionId}`,
              );
            }
          }
        })
        .catch((err) => {
          console.warn("[useChat] End-of-session summarization failed:", err);
        });
    }

    startSession(dog?.id ?? "local");
    setDynamicSuggestions([]); // Reset to static prompts for new session
  }, [dog?.id, currentSessionId, activeDogId, dogName]);

  const setFeedback = useCallback(
    (messageId: string, feedback: "positive" | "negative") => {
      setFeedbackAction(messageId, feedback);
    },
    []
  );

  // Detect expression from last assistant message
  const lastAssistantMsg = [...sessionMessages]
    .reverse()
    .find((m) => m.role === "assistant");
  if (lastAssistantMsg) {
    buddyExpressionRef.current = detectExpression(lastAssistantMsg.content);
  }

  return {
    messages: sessionMessages,
    isStreaming,
    canSend,
    remainingMessages,
    suggestedPrompts,
    buddyExpression: buddyExpressionRef.current,
    isLiveAI,
    sendMessage,
    sendSuggestedPrompt,
    setFeedback,
    startNewSession,
    clearChat: clearConversation,
  };
}

// ──────────────────────────────────────────────
// Real AI — Claude Sonnet 4.6 via buddy-chat Edge Function
// ──────────────────────────────────────────────

async function sendToRealAI(
  systemPrompt: string,
  history: { role: string; content: string }[],
  messageId: string,
  dogName?: string,
): Promise<{ suggestedPrompts: string[] }> {
  const { updateStreamingContent, finishStreaming } = useChatStore.getState();

  const messages: AIMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  console.log(
    "[Chat] Sending to AI provider:",
    messages.length,
    "messages, roles:",
    messages.map((m) => m.role).join(", ")
  );

  return new Promise<{ suggestedPrompts: string[] }>((resolve, reject) => {
    streamChatCompletion(
      systemPrompt,
      messages,
      {
        onToken: (fullText) => {
          updateStreamingContent(messageId, fullText);
        },
        onDone: (fullText, meta) => {
          console.log("[Chat] AI response complete, length:", fullText.length);
          if (meta?.suggestedPrompts?.length) {
            console.log("[Chat] Dynamic suggestions:", meta.suggestedPrompts);
          }
          updateStreamingContent(messageId, fullText);
          finishStreaming(messageId);
          resolve({ suggestedPrompts: meta?.suggestedPrompts ?? [] });
        },
        onError: (error) => {
          console.error("[Chat] AI error:", error.message);
          finishStreaming(messageId);
          reject(error);
        },
      },
      { dogName },
    ).catch((err) => {
      console.error("[Chat] Unhandled AI error:", err);
      finishStreaming(messageId);
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

// ──────────────────────────────────────────────
// Mock AI, Fallback when no API key
// ──────────────────────────────────────────────

async function sendToMockAI(
  messageId: string,
  dogName: string,
  userMessage: string
): Promise<void> {
  const { updateStreamingContent, finishStreaming } = useChatStore.getState();

  const response = generateMockResponse(dogName, userMessage);

  // Simulate streaming with natural typing feel
  let streamed = "";
  const words = response.split(" ");

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;
    streamed += (i > 0 ? " " : "") + word;
    updateStreamingContent(messageId, streamed);

    const delay =
      word.endsWith(".") || word.endsWith("!") || word.endsWith("?")
        ? 80 + Math.random() * 60
        : 25 + Math.random() * 35;
    await new Promise((r) => setTimeout(r, delay));
  }

  finishStreaming(messageId);
}

function generateMockResponse(dogName: string, userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (
    lower.includes("potty") ||
    lower.includes("accident") ||
    lower.includes("pee") ||
    lower.includes("poop")
  ) {
    return `Oh no, accidents happen, don't stress about it! At this age, ${dogName}'s bladder is still developing, and it takes time for them to build that muscle control.\n\nHere's the key: take ${dogName} outside every 1-2 hours, and *always* right after waking up, eating, and playing. When ${dogName} goes in the right spot, throw a little party, treats, praise, the works! 🎉\n\nIf you catch an accident in progress, calmly pick ${dogName} up and carry them outside. No scolding. They won't connect it to the accident.\n\nTry this today: Set a phone timer for every 90 minutes as a potty reminder. Consistency is everything here.`;
  }

  if (
    lower.includes("bit") ||
    lower.includes("nip") ||
    lower.includes("chew") ||
    lower.includes("mouth")
  ) {
    return `I hear you, puppy biting is one of the most frustrating phases, but it IS a phase. ${dogName} isn't being bad; this is literally how puppies explore the world.\n\nThe magic technique: When ${dogName} bites, say "ouch" calmly and immediately redirect to a toy. If ${dogName} keeps going, stand up and turn away for 10 seconds. This teaches that biting = play stops.\n\nMake sure ${dogName} has plenty of appropriate chew toys around. Frozen wet washcloths are amazing for teething pups! 🧊\n\nTry this today: Keep a toy within arm's reach at all times. The instant you feel teeth, swap your hand for the toy and praise ${dogName} for chewing it.`;
  }

  if (
    lower.includes("jump") ||
    lower.includes("guest") ||
    lower.includes("visitor")
  ) {
    return `Jumping is one of those behaviours that's actually really easy to fix, it just takes consistency from everyone in ${dogName}'s life.\n\nThe rule is simple: ${dogName} only gets attention when all four paws are on the floor. When ${dogName} jumps, turn your back completely and ignore. The SECOND all four paws are down, turn around and give calm praise.\n\nFor guests, have them follow the same rule. You can also keep ${dogName} on a leash when people arrive so you can manage the situation.\n\nTry this today: Practice at the front door. Have someone ring the bell, and reward ${dogName} for sitting instead of jumping. Start with just you before adding real guests.`;
  }

  if (
    lower.includes("crate") ||
    lower.includes("kennel") ||
    lower.includes("whining") ||
    lower.includes("cry")
  ) {
    return `Crate training takes patience, but once ${dogName} loves the crate, it becomes their safe haven, like a cozy bedroom.\n\nThe #1 rule: never use the crate as punishment. We want ${dogName} to think "crate = good things happen."\n\nStart by feeding meals inside the crate with the door open. Then try closing the door just during meals. Gradually increase the time with the door closed.\n\nIf ${dogName} whines, wait for even 2 seconds of quiet before opening. This teaches that quiet = door opens, not whining.\n\nTry this today: Toss a few treats into the crate and let ${dogName} go in and out freely. No closing the door yet, just building that positive association.`;
  }

  if (
    lower.includes("leash") ||
    lower.includes("pull") ||
    lower.includes("walk")
  ) {
    return `Leash walking is honestly one of the trickiest skills to teach, so don't feel bad if ${dogName} isn't getting it right away!\n\nThe technique that works best: When ${dogName} pulls, stop walking completely. Stand still like a tree. 🌳 The moment ${dogName} looks back at you or the leash goes slack, mark it ("yes!") and continue walking.\n\nConsistency is everything here. If you sometimes let ${dogName} pull to get somewhere, it teaches that pulling works sometimes, which makes it way harder to fix.\n\nTry this today: Start with just 5-minute practice walks in a low-distraction area (like your garden or a quiet street). Save the longer adventure walks for when ${dogName}'s leash skills improve.`;
  }

  if (
    lower.includes("learned") ||
    lower.includes("did it") ||
    lower.includes("first time") ||
    lower.includes("great day") ||
    lower.includes("good")
  ) {
    return `Wait, that's AMAZING! 🎉 I'm so proud of ${dogName}! That kind of progress doesn't happen by accident, it's because you've been putting in the work consistently!\n\nMake sure you celebrate this win with ${dogName} too. A special treat, extra playtime, or just loads of praise. Dogs pick up on our excitement and it reinforces that they did something awesome.\n\nKeep this momentum going! What should we work on next?`;
  }

  if (lower.includes("breed") || lower.includes("normal for")) {
    return `Great question! Every breed has their own personality quirks and tendencies. What ${dogName}'s doing sounds completely within the range of normal puppy behaviour, but there might be some breed-specific things we can use to our advantage.\n\nFor instance, some breeds are more food-motivated (which makes training easier!), while others respond better to play rewards. Understanding what makes ${dogName} tick is the key to faster progress.\n\nWhat specifically about ${dogName}'s behaviour are you wondering about? I can give you more targeted advice.`;
  }

  if (
    lower.includes("vomit") ||
    lower.includes("blood") ||
    lower.includes("limp") ||
    lower.includes("poison") ||
    lower.includes("chocolate") ||
    lower.includes("sick")
  ) {
    return `I want to make sure ${dogName} is okay. This is something I'd recommend checking with your vet about.\n\nIf ${dogName} seems to be in distress, is lethargic, or the symptoms are getting worse, please contact your vet or emergency animal hospital right away. For potential poisoning, you can also call ASPCA Poison Control: (888) 426-4435.\n\nOnce the vet gives the all-clear, I'm here to help adjust ${dogName}'s training if needed. ${dogName}'s health always comes first. 💛`;
  }

  if (
    lower.includes("work on today") ||
    lower.includes("today's training") ||
    lower.includes("what should")
  ) {
    return `Let's check in on ${dogName}'s training plan! Based on where you are, I'd suggest focusing on a short, fun session today.\n\nHere's what I'd recommend:\n\n1. Start with a 2-minute warm-up of a skill ${dogName} already knows (like sit or name response). This builds confidence.\n2. Spend 5 minutes on your current exercise from the plan\n3. End with play or a high-value treat so ${dogName} associates training with good times\n\nThe whole thing should take about 10 minutes. Short sessions are actually more effective than long ones. ${dogName}'s attention span is still developing!\n\nHead over to the Plan tab to see your specific exercises for today. 📋`;
  }

  return `That's a great question about ${dogName}! Let me think about this...\n\nAt this stage in ${dogName}'s development, the most important thing is consistency and patience. Every puppy learns at their own pace, and what feels like slow progress now is actually building a really strong foundation.\n\nHere's what I'd suggest: focus on one thing at a time, keep sessions short (5-10 minutes), and always end on a positive note. ${dogName} should feel like training is the best part of the day!\n\nWhat specific aspect of this would you like me to dig deeper into?`;
}
