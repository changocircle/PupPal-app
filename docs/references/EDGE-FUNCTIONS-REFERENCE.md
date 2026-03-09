# PupPal Edge Functions Reference
> Detailed reference for all 3 deployed Supabase Edge Functions.

## buddy-chat (PRD-02)

**File:** `supabase/functions/buddy-chat/index.ts`
**Deploy:** `supabase functions deploy buddy-chat --project-ref klttrrdyplsemqiudfvf`

### Config
- Model: `claude-sonnet-4-6`
- max_tokens: 200
- WORD_LIMIT_PREFIX: "HARD LIMIT: Maximum 50 words per response..."
- Post-processing: truncates at 400 chars (sentence-boundary aware)

### Rate Limiting
- 20 req/min per IP
- In-memory (resets on cold start)

### Security
- CORS: wildcard (fine for mobile)
- Content moderation: blocked regex patterns for prompt injection
- ANTHROPIC_API_KEY server-side only

### Multi-Dog Context
System prompt includes ALL registered dogs (name, breed, age, challenges) so Buddy can answer questions about any dog in the household.

### Training Context Injection (PR #29)
- System prompt includes active dog's training plan exercises resolved from 164-exercise library
- Uses `getExerciseById()` to get real exercise names/titles (not just IDs)
- `hasPlan` boolean in DogContext - system prompt says "NOT YET GENERATED" when no plan
- CRITICAL RULES section forbids exercise hallucination (only reference exercises in plan)

### Dynamic Suggested Prompts (PR #29)
- After each chat response, a lightweight second Sonnet call generates 3-4 contextual follow-ups
- Client stores in `dynamicSuggestions` state via `useState`
- Prefers AI-generated suggestions over static `generateSuggestedPrompts()` fallback
- Non-fatal: falls back to static suggestions if generation fails
- `dogName` passed to edge function for personalization

### Client Interface
```
POST: { systemPrompt, messages, maxTokens?, dogName? }
Response: { content, model, usage, stop_reason, suggestedPrompts?: string[] }
```

---

## breed-classify (PRD-01)

**File:** `supabase/functions/breed-classify/index.ts`
**Deploy:** `supabase functions deploy breed-classify --project-ref klttrrdyplsemqiudfvf`

### Config
- Model: HuggingFace ViT (`nickmuchi/vit-finetuned-dog-classifier`, 120 Stanford Dogs breeds)
- Fallback model: `Falconsai/dog-breed-identification`
- HF timeout: 15s
- Returns top 3 predictions with confidence

### Auth
- No JWT verification. Supabase client always sends anon key as Bearer token, which is not a user JWT and would always fail verification.
- Rate limiting (10/min/IP) is the abuse protection. Deploy with `--no-verify-jwt`.

### Rate Limiting
- 10 req/min per IP (in-memory, resets on cold start)

### Client Interface
```
POST: { imageBase64: string, mimeType?: string }
Response: { predictions: [{ breed: string, confidence: number, rawLabel: string }] }
```

---

## breed-detect (PRD-01)

**File:** `supabase/functions/breed-detect/index.ts`
**Deploy:** `supabase functions deploy breed-detect --project-ref klttrrdyplsemqiudfvf`

### Config
- Model: `claude-sonnet-4-6`
- max_tokens: 800
- Anthropic timeout: 30s
- Client timeout: 35s
- Rate limit: 10 req/min per IP

### Auth
- No JWT verification. Supabase client always sends anon key as Bearer token, which is not a user JWT and would always fail verification.
- Rate limiting (10/min/IP) is the abuse protection. Deploy with `--no-verify-jwt`.

### Multi-Photo Support
- Accepts 1-3 base64 images
- Separate prompts for single vs multi-photo
- Multi-photo prompt cross-references features across angles (front, side, body)
- **Same-dog validation (PR #23):** Step 0 checks if all photos show the same dog (size, coloring, coat, markings). Returns `{ error: "different_dogs", message: "..." }` if different dogs detected.

### Chain-of-Thought Prompt
1. Observe: 7-step feature analysis (coat type/length, color/pattern, ear shape, snout, body, tail, size estimate)
2. Identify: Top 3 breeds with confidence
3. Verify: Note atypical features (softer than "find contradictions")
4. Reasoning field logged server-side only (not sent to client)

### Client Interface
```
POST: { image: string } (single) or { images: string[] } (multi)
Response: { breeds: [{ name, confidence }], reasoning?: string }
```

### Confidence Paths
- >= 80%: High confidence, show breed with confirm button
- 50-80%: Medium confidence, show with "Change breed" option
- < 50%: Low confidence, ask user to select manually

---

## vaccine-extract (Vaccination Setup)

**File:** `supabase/functions/vaccine-extract/index.ts`
**Deploy:** `supabase functions deploy vaccine-extract --project-ref klttrrdyplsemqiudfvf`

### Config
- Model: `claude-sonnet-4-6`
- max_tokens: 1500
- Max images: 5
- Rate limit: 10 req/min per IP

### How It Works
1. User uploads up to 5 photos of vet vaccination records
2. Claude vision reads handwritten/printed records
3. Extracts: vaccine name, date, dose number, vet clinic
4. Client-side fuzzy matching (vaccineMatch.ts) maps extracted names to known templates
5. Confirmation screen shows matched vaccines with toggles
6. User confirms, data saved to healthStore

### Client Interface
```
POST: { images: string[] }
Response: { vaccines: [{ name, date, doseNumber, vetClinic }] }
```
