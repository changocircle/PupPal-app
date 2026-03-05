# PRD #12: Breed Encyclopedia & Content Library

## PupPal — Know Your Dog Inside and Out

**Document version**: 1.0
**Priority**: P2 — SEO/ASO content magnet, trust builder, and a reason for non-subscribers to keep the app installed. Also provides the data backbone for personalization across all features.

---

## 1. Overview & Purpose

The Breed Encyclopedia serves two purposes:

1. **User-facing**: A comprehensive, beautifully designed breed reference that answers "What should I know about my [breed]?" Covers temperament, training tips, health predispositions, growth expectations, exercise needs, grooming, and feeding.

2. **System backbone**: The breed profile data powers personalization across every feature — training plan generation, Buddy's breed-specific advice, health screening recommendations, growth curves, trick aptitude filtering, and exercise duration adjustments.

### Why This Matters

- **Trust builder**: Breed-specific content proves PupPal "gets" their dog. Generic apps feel one-size-fits-all.
- **SEO/ASO**: "Golden Retriever training guide" is a high-intent search query. Each breed page is a potential acquisition channel.
- **Retention for free users**: Breed content is partially free — keeps free users engaged and returning.
- **Reduces support load**: Users self-serve breed questions instead of asking Buddy repeatedly.

### Success Metrics

| Metric | Target |
|--------|--------|
| Breed page views | 40%+ of users view their breed page in first week |
| Breed page return visits | 2+ views per user per month |
| Breed page → training link taps | 15%+ click through to related exercises |
| Content coverage | Top 50 breeds + mixed breed at launch |

---

## 2. Breed Data Model

```
BreedProfile {
  id: UUID
  name: string                          // "Golden Retriever"
  slug: string                          // "golden-retriever"
  akc_group: string                     // "Sporting"
  size_category: enum (toy/small/medium/large/giant)
  
  // Physical
  weight_range_male: { min: float, max: float }    // lbs
  weight_range_female: { min: float, max: float }
  height_range: { min: float, max: float }          // inches
  life_expectancy: { min: integer, max: integer }   // years
  coat_type: string                     // "Double coat, medium length"
  coat_colors: array of string
  shedding_level: enum (low/moderate/high/very_high)
  grooming_frequency: string            // "2-3x per week"
  hypoallergenic: boolean
  
  // Temperament
  temperament_tags: array of string     // ["Friendly", "Intelligent", "Devoted"]
  energy_level: enum (low/moderate/high/very_high)
  trainability: enum (low/moderate/high/very_high)
  friendliness_people: enum (low/moderate/high/very_high)
  friendliness_dogs: enum (low/moderate/high/very_high)
  friendliness_children: enum (low/moderate/high/very_high)
  barking_tendency: enum (low/moderate/high/very_high)
  prey_drive: enum (low/moderate/high/very_high)
  separation_anxiety_risk: enum (low/moderate/high)
  
  // Training
  learning_speed: enum (slow/average/fast/very_fast)
  stubbornness: enum (low/moderate/high/very_high)
  trick_aptitude: enum (low/moderate/high/very_high)
  common_training_challenges: array of string
  training_tips: array of string        // Breed-specific tips
  recommended_training_style: string    // "Food-motivated, short sessions"
  
  // Health
  brachycephalic: boolean
  common_conditions: array of {
    condition: string,
    prevalence: enum (low/moderate/high),
    description: string,
    symptoms: array of string
  }
  recommended_screenings: array of {
    screening: string,
    recommended_age: string,
    importance: enum (essential/recommended/optional)
  }
  medication_sensitivities: array of string   // MDR1, etc.
  spay_neuter_recommendation: string
  exercise_needs_daily_minutes: { min: integer, max: integer }
  heat_sensitivity: enum (low/moderate/high/critical)
  cold_sensitivity: enum (low/moderate/high)
  
  // Growth
  growth_curve_data: reference to BreedGrowthData
  adult_weight_age_months: integer      // When they reach adult weight
  teething_peak_weeks: { start: integer, end: integer }
  adolescence_weeks: { start: integer, end: integer }
  social_maturity_months: integer
  
  // Content
  breed_description: string             // 2-3 paragraph overview
  history: string                       // Breed history/origin
  fun_facts: array of string
  celebrity_dogs: array of string       // Famous dogs of this breed
  puppy_tips: array of string           // Specific to puppies of this breed
  diet_notes: string
  exercise_notes: string
  grooming_notes: string
  
  // Media
  hero_image_url: string (nullable)
  gallery_urls: array of string
  
  // Metadata
  popularity_rank: integer (nullable)   // AKC popularity
  active: boolean
  created_at: timestamp
  updated_at: timestamp
}

BreedGrowthData {
  id: UUID
  breed_id: UUID
  sex: enum (male/female)
  data_points: array of {
    age_weeks: integer,
    weight_low: float,      // 25th percentile
    weight_avg: float,      // 50th percentile
    weight_high: float      // 75th percentile
  }
}
```

---

## 3. Breed Page UI

### Breed Detail Screen

```
┌─────────────────────────────┐
│  ← Golden Retriever          │
│                              │
│  ┌─────────────────────────┐ │
│  │  [Hero image / gallery] │ │
│  └─────────────────────────┘ │
│                              │
│  Golden Retriever            │  ← h1
│  Sporting Group · Large      │  ← subtitle
│  #3 Most Popular Breed       │
│                              │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│  │🏃 │ │🧠 │ │👶 │ │🐕 │   │  ← Quick stat pills
│  │Hi │ │Hi │ │Hi │ │Hi │   │
│  │Ener│ │Trn│ │Kid│ │Dog│   │
│  └───┘ └───┘ └───┘ └───┘   │
│                              │
│  ABOUT                       │
│  Friendly, intelligent, and  │
│  devoted, Golden Retrievers  │
│  are one of the most popular │
│  family dogs for good reason.│
│  [Read more...]              │
│                              │
│  TRAINING TIPS FOR GOLDENS   │
│  • Highly food-motivated...  │
│  • Mouthy as puppies...      │
│  • Excel at retrieval games  │
│  [View {Name}'s Plan →]      │  ← Link to training plan
│                              │
│  HEALTH OVERVIEW             │
│  Common conditions:          │
│  Hip Dysplasia (high)        │
│  Cancer (high)               │
│  Allergies (moderate)        │
│  [Full Health Profile →]     │  ← Link to health tracker
│                              │
│  GROWTH & SIZE               │
│  Adult weight: 55-75 lbs     │
│  Adult height: 21-24 in      │
│  Reaches adult size: ~14 mo  │
│  [View Growth Chart →]       │  ← Link to weight tracker
│                              │
│  KEY MILESTONES              │
│  Teething: 12-24 weeks       │
│  Adolescence: 6-18 months    │
│  Social maturity: 24 months  │
│                              │
│  CARE                        │
│  Exercise: 60-90 min/day     │
│  Grooming: 2-3x/week        │
│  Shedding: Very High 🧹      │
│  Heat sensitivity: Moderate  │
│                              │
│  FUN FACTS                   │
│  • 3rd most popular breed    │
│  • Originally bred for...    │
│  • Famous Goldens: Buddy,... │
│                              │
└─────────────────────────────┘
```

### Quick Stats

Visual rating bars or filled dots (1-5 scale):
- Energy Level
- Trainability
- Kid-Friendly
- Dog-Friendly
- Barking
- Shedding

### Content Linking

Every section links to the relevant PupPal feature:
- Training tips → user's training plan
- Health → health tracker
- Growth → weight chart
- Milestones → developmental milestones

This drives engagement with other features and increases perceived value.

---

## 4. Breed Browser

### All Breeds Screen

```
┌─────────────────────────────┐
│  Breed Encyclopedia          │
│  ┌─────────────────────────┐ │
│  │ 🔍 Search breeds...     │ │
│  └─────────────────────────┘ │
│                              │
│  YOUR DOG                    │
│  ┌─────────────────────────┐ │
│  │ Golden Retriever →       │ │  ← Quick access
│  └─────────────────────────┘ │
│                              │
│  BROWSE BY SIZE              │
│  [Toy] [Small] [Medium]     │
│  [Large] [Giant]             │
│                              │
│  POPULAR BREEDS              │
│  ┌─────────┐ ┌─────────┐    │
│  │Labrador │ │French   │    │
│  │Retriever│ │Bulldog  │    │
│  └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐    │
│  │German   │ │Poodle   │    │
│  │Shepherd │ │         │    │
│  └─────────┘ └─────────┘    │
│  ...                         │
└─────────────────────────────┘
```

Search: fuzzy match on breed name. Filter: by size, by AKC group.

---

## 5. Launch Coverage

**Top 50 breeds by AKC popularity + Mixed Breed default**:

Labrador Retriever, French Bulldog, Golden Retriever, German Shepherd, Poodle, Bulldog, Rottweiler, Beagle, Dachshund, German Shorthaired Pointer, Pembroke Welsh Corgi, Australian Shepherd, Yorkshire Terrier, Cavalier King Charles Spaniel, Doberman Pinscher, Boxer, Miniature Schnauzer, Cane Corso, Great Dane, Shih Tzu, Siberian Husky, Bernese Mountain Dog, Pomeranian, Boston Terrier, Havanese, English Springer Spaniel, Shetland Sheepdog, Brittany, Cocker Spaniel, Miniature American Shepherd, Border Collie, Vizsla, Maltese, Weimaraner, Chihuahua, Bichon Frise, Basset Hound, Belgian Malinois, Collie, Newfoundland, Rhodesian Ridgeback, West Highland White Terrier, Shiba Inu, Bloodhound, Akita, Portuguese Water Dog, Chesapeake Bay Retriever, Dalmatian, Samoyed, Australian Cattle Dog.

**Mixed Breed**: Default profile with average medium-dog stats, general training tips, broad health overview. Users can specify size estimate (toy/small/medium/large/giant) for better growth curves.

Expansion: Add 10-20 breeds per month. Community can request breeds.

---

## 6. Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| Their dog's breed page | ✅ Full access | ✅ |
| Other breed pages | ✅ Overview + 2 sections | ✅ Full |
| Breed browser | ✅ | ✅ |
| Growth chart data | ❌ Blurred | ✅ |
| Health condition details | ✅ Names only | ✅ Full |
| Training tips per breed | ✅ First 2 tips | ✅ All |
| Link to training plan | ❌ (gated to plan) | ✅ |

User's own breed page is fully free — this is information about THEIR dog. Gating it would feel adversarial.

---

## 7. API Endpoints

```
GET /api/breeds                         — List all breeds (name, slug, size, image)
GET /api/breeds/{slug}                  — Full breed profile
GET /api/breeds/{slug}/growth-curve     — Growth data points
GET /api/breeds/search?q={query}        — Search breeds
GET /api/breeds/by-size/{size}          — Filter by size category
```

---

## 8. Acceptance Criteria

- [ ] 50 breed profiles + mixed breed seeded at launch
- [ ] Breed detail page shows all sections with correct data
- [ ] Quick stat visualizations render correctly
- [ ] Content links navigate to relevant features (plan, health, weight)
- [ ] Breed browser with search and size filter works
- [ ] User's breed page accessible quickly from multiple entry points
- [ ] Growth chart data powers weight tracker breed curves
- [ ] Health data powers health tracker breed conditions
- [ ] Training data feeds plan generation breed modifiers
- [ ] Free users see full own-breed page, limited other breeds
- [ ] Mixed breed has sensible default profile with size selection
