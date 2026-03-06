/**
 * Developmental Milestone Templates, PRD-05 §8
 *
 * Breed and age-specific milestones for physical,
 * behavioural, and health development stages.
 */

import type { DevelopmentalMilestone } from "@/types/health";

export const MILESTONE_TEMPLATES: DevelopmentalMilestone[] = [
  // ─── Physical ────────────────────────────────
  {
    id: "teething_start",
    name: "Baby Teeth Falling Out",
    category: "physical",
    description:
      "Your pup's baby teeth will start to fall out as adult teeth come in. You may find tiny teeth in toys or on the floor!",
    typicalAgeWeeksStart: 14,
    typicalAgeWeeksEnd: 18,
    tips: [
      "Provide plenty of appropriate chew toys",
      "Frozen washcloths can soothe sore gums",
      "Check mouth gently for retained baby teeth",
      "It's normal for gums to bleed a little",
    ],
    buddyMessage:
      "Teething time! If your pup is extra chewy right now, that's totally normal. Let's make sure they have the right things to gnaw on! 🦷",
    isTrackable: true,
  },
  {
    id: "teething_complete",
    name: "Adult Teeth Complete",
    category: "physical",
    description:
      "All 42 adult teeth are in! Teething discomfort should be winding down.",
    typicalAgeWeeksStart: 24,
    typicalAgeWeeksEnd: 30,
    tips: [
      "Start regular dental care routines now",
      "Introduce tooth brushing with dog-safe toothpaste",
      "Dental chews help maintain healthy teeth",
      "Schedule a dental check at the next vet visit",
    ],
    buddyMessage:
      "Those beautiful adult teeth are all in! Now's the perfect time to start a dental routine. 🪥",
    isTrackable: true,
  },
  {
    id: "ears_standing",
    name: "Ears Standing Up",
    category: "physical",
    description:
      "For breeds with erect ears (German Shepherds, Corgis, etc.), ears may go up and down during teething before staying upright.",
    typicalAgeWeeksStart: 12,
    typicalAgeWeeksEnd: 32,
    tips: [
      "Ears may flop during teething, this is normal",
      "Don't tape or manipulate ears without vet guidance",
      "If one ear is up and one down, give it time",
      "Most ears are fully erect by 6-8 months",
    ],
    buddyMessage:
      "Watching those ears is like watching a fun little show! They may go up, down, sideways. All totally normal during teething. 😄",
    isTrackable: true,
  },
  {
    id: "coat_change",
    name: "Puppy Coat to Adult Coat",
    category: "physical",
    description:
      "Your pup's soft puppy coat will gradually be replaced by their adult coat. Expect extra shedding!",
    typicalAgeWeeksStart: 16,
    typicalAgeWeeksEnd: 52,
    tips: [
      "Increase brushing during coat transition",
      "A good quality brush suited to coat type helps",
      "Nutrition affects coat quality, ensure balanced diet",
      "Some breeds' coat colour changes during this time",
    ],
    buddyMessage:
      "The coat change is happening! Get ready for some extra fur around the house. Time to invest in a good brush! 🧹",
    isTrackable: true,
  },
  {
    id: "adult_height",
    name: "Reaching Adult Height",
    category: "physical",
    description:
      "Most dogs reach their adult height before their adult weight. Small breeds earlier, giant breeds later.",
    typicalAgeWeeksStart: 26,
    typicalAgeWeeksEnd: 78,
    tips: [
      "Height usually comes before weight",
      "Small breeds may reach adult height by 6 months",
      "Large/giant breeds may grow until 18 months+",
      "Don't over-exercise growing joints",
    ],
    buddyMessage:
      "Your pup is reaching full height! They might look a bit lanky, they'll fill out with time. 📏",
    isTrackable: true,
  },

  // ─── Behavioral ──────────────────────────────
  {
    id: "fear_period_1",
    name: "Fear Period #1",
    category: "behavioral",
    description:
      "The first fear period is a critical window where puppies may become cautious or startled by new things. Positive, gentle socialization is key.",
    typicalAgeWeeksStart: 8,
    typicalAgeWeeksEnd: 11,
    tips: [
      "Keep all new experiences positive and gentle",
      "Don't force your pup into scary situations",
      "If something scares them, calmly redirect, don't over-comfort",
      "This is a normal developmental phase, not a training failure",
      "Avoid traumatic experiences (loud events, aggressive dogs)",
    ],
    buddyMessage:
      "Heads up! Your pup is in the first fear period. If they seem extra cautious, that's completely normal! Keep things positive and let them explore at their own pace. 💛",
    isTrackable: false,
  },
  {
    id: "fear_period_2",
    name: "Fear Period #2",
    category: "behavioral",
    description:
      "The second fear period often catches owners off guard, a previously confident puppy may suddenly become wary. This is normal adolescent development.",
    typicalAgeWeeksStart: 26,
    typicalAgeWeeksEnd: 60,
    tips: [
      "Don't punish fearful behaviour",
      "Continue positive exposure at their pace",
      "It may come and go over several weeks",
      "Confidence will return, be patient",
      "Counter-condition with treats near 'scary' things",
    ],
    buddyMessage:
      "Second fear period alert! If your pup is suddenly spooked by things that didn't bother them before, that's totally normal adolescent stuff. They'll work through it! 🤗",
    isTrackable: false,
  },
  {
    id: "adolescent_phase",
    name: "Adolescent Phase",
    category: "behavioral",
    description:
      "Your pup is a teenager! Expect boundary testing, selective hearing, and bursts of energy. Consistent training is more important than ever.",
    typicalAgeWeeksStart: 26,
    typicalAgeWeeksEnd: 78,
    tips: [
      "Stay consistent with rules and routines",
      "Increase mental stimulation, puzzle toys, training games",
      "Don't take defiance personally. It's developmental",
      "Re-proof known commands in new environments",
      "Exercise helps channel adolescent energy",
    ],
    buddyMessage:
      "Welcome to the teenage phase! 🎸 Your pup might 'forget' things they used to know. They haven't! They're just testing boundaries. Stay patient and consistent!",
    isTrackable: false,
  },
  {
    id: "social_maturity",
    name: "Social Maturity",
    category: "behavioral",
    description:
      "Your dog is reaching social maturity! They may become more selective about dog friends and show stronger personality traits.",
    typicalAgeWeeksStart: 52,
    typicalAgeWeeksEnd: 156,
    tips: [
      "It's normal for dogs to become more selective about playmates",
      "Watch for any signs of dog reactivity developing",
      "Continue positive social experiences",
      "Personality is more settled, this is the 'real' them",
    ],
    buddyMessage:
      "Your pup is becoming a fully-fledged adult dog! Their personality is really shining through now. 🌟",
    isTrackable: false,
  },

  // ─── Health ──────────────────────────────────
  {
    id: "spay_neuter_window",
    name: "Spay/Neuter Discussion",
    category: "health",
    description:
      "This is typically when to discuss spay/neuter timing with your vet. Recommendations vary by breed, size, and individual health factors.",
    typicalAgeWeeksStart: 24,
    typicalAgeWeeksEnd: 52,
    tips: [
      "Talk to your vet about the best timing for your breed",
      "Large breeds may benefit from waiting longer",
      "Discuss health implications with your vet",
      "This is a personal decision, no one-size-fits-all answer",
    ],
    buddyMessage:
      "Time to chat with your vet about spay/neuter timing! Every dog is different, so your vet can give the best advice for your specific pup. 🩺",
    isTrackable: true,
  },
  {
    id: "food_transition",
    name: "Puppy to Adult Food",
    category: "health",
    description:
      "Time to transition from puppy food to adult formula. Small breeds transition earlier, large breeds later.",
    typicalAgeWeeksStart: 40,
    typicalAgeWeeksEnd: 104,
    tips: [
      "Transition gradually over 7-10 days",
      "Mix increasing amounts of adult food with puppy food",
      "Small breeds: around 9-12 months",
      "Large breeds: 12-24 months",
      "Ask your vet for specific food recommendations",
    ],
    buddyMessage:
      "Puppy food graduation day is approaching! Let's plan a smooth transition to adult food. Your vet can recommend the best option. 🍖",
    isTrackable: true,
  },
  {
    id: "first_annual_exam",
    name: "First Annual Wellness Exam",
    category: "health",
    description:
      "Schedule your dog's first annual wellness exam. This is different from puppy vaccine visits, it's a comprehensive health check.",
    typicalAgeWeeksStart: 52,
    typicalAgeWeeksEnd: 60,
    tips: [
      "Bring a list of any concerns or questions",
      "Expect a full physical exam, dental check, and blood work discussion",
      "Ask about heartworm testing if not already done",
      "Discuss preventive care plan for the year",
    ],
    buddyMessage:
      "Time for the first annual check-up! This is a great chance to ask your vet all those questions you've been saving up. 📝",
    isTrackable: true,
  },
];

/**
 * Get milestones relevant to a dog's current age.
 */
export function getMilestonesForAge(ageWeeks: number): DevelopmentalMilestone[] {
  return MILESTONE_TEMPLATES.filter(
    (m) => ageWeeks <= m.typicalAgeWeeksEnd + 4 // show slightly past end
  );
}
