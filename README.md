# PupPal 🐕

> AI-powered puppy training app — like having a dog trainer on call 24/7

PupPal is a personalized AI puppy training app that solves new puppy parent anxiety. Not a content library — a personal mentor that knows your dog's breed, age, temperament, and training history.

## Tech Stack

- **Mobile**: React Native + Expo SDK 52 + TypeScript
- **Routing**: Expo Router v4 (file-based)
- **Styling**: NativeWind v4 (Tailwind CSS for RN)
- **State**: Zustand (client) + TanStack Query v5 (server)
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI**: Vercel AI SDK + Kimi K2.5
- **Animations**: React Native Reanimated 3 + Moti

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in your Supabase credentials

# Start development server
npx expo start
```

Then open [Expo Go](https://expo.dev/go) on your phone and scan the QR code.

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for the complete project context, architecture, and conventions.

## Documentation

All PRDs and specs are in the `docs/` folder:

| Doc | Description |
|-----|-------------|
| [CLAUDE.md](./CLAUDE.md) | Project context & conventions |
| [DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) | Visual design specification |
| [TECH-STACK.md](./docs/TECH-STACK.md) | Technology decisions |
| [Build Playbook](./docs/PupPal-Build-Playbook.md) | Step-by-step development guide |
| [PRD-01](./docs/PRD-01-Onboarding-Flow.md) | Onboarding flow |
| [PRD-02](./docs/PRD-02-AI-Mentor-Chat.md) | AI Mentor Chat (Buddy) |
| [PRD-03](./docs/PRD-03-Training-Plan-Engine.md) | Training Plan Engine |
| [PRD-04](./docs/PRD-04-Gamification-System.md) | Gamification System |
| [PRD-05](./docs/PRD-05-Health-Vaccination-Tracker.md) | Health & Vaccination Tracker |
| [PRD-06](./docs/PRD-06-Paywall-Subscriptions.md) | Paywall & Subscriptions |
| [PRD-07](./docs/PRD-07-Free-Premium-Gating.md) | Free/Premium Gating |
| [PRD-08](./docs/PRD-08-Referral-Viral-Growth.md) | Referral & Growth |
| [PRD-09](./docs/PRD-09-Push-Notifications-Retention.md) | Push Notifications |
| [PRD-10](./docs/PRD-10-Growth-Journal.md) | Growth Journal |
| [PRD-11](./docs/PRD-11-Multi-Dog.md) | Multi-Dog Support |
| [PRD-12](./docs/PRD-12-Breed-Encyclopedia.md) | Breed Encyclopedia |
| [PRD-13](./docs/PRD-13-Analytics-AB-Testing.md) | Analytics & A/B Testing |
| [PRD-14](./docs/PRD-14-Settings.md) | Settings |
| [PRD-15](./docs/PRD-15-Community.md) | Community (post-launch) |

## Hybrid Breed Detection

PupPal uses a two-step hybrid approach for accurate breed identification.

### Flow

```
Photo -> breed-classify (HuggingFace ViT, ~2s)
              |
     Top 3 breed candidates
              |
        breed-detect (Claude Sonnet)
              |
  Validated breed result + reasoning
```

### Step 1: breed-classify Edge Function

- Model: `nickmuchi/vit-finetuned-dog-classifier` (ViT fine-tuned on 120 Stanford Dogs breeds)
- Fallback model: `Falconsai/dog-breed-identification`
- Input: base64 image (primary photo only)
- Output: top 3 predictions with confidence scores
- Graceful degradation: returns empty predictions if unavailable

### Step 2: breed-detect Edge Function (updated)

- Model: `claude-sonnet-4-6`
- Hybrid mode: Sonnet validates classifier output visually (size, coat, face, proportions)
- Standard mode: Sonnet does full independent analysis (backward compatible)
- Confidence caps: 65 for single photo, 85 for multi-photo

### Client Progress (src/lib/breedDetect.ts)

```
detectBreed(uris, onProgress)
  onProgress("classifying")  -> UI: "Scanning breed..." / "Comparing with 120 breeds..."
  onProgress("confirming")   -> UI: "Confirming with AI..." / "Cross-referencing features..."
  -> BreedDetectResult
```

### Required Secrets

| Secret | Required | Notes |
|--------|----------|-------|
| `ANTHROPIC_API_KEY` | Yes | Claude Sonnet reasoning |
| `HUGGINGFACE_API_KEY` | No | Free tier works without it |

### Why HuggingFace API (Option B) vs TFLite (Option A)

The app uses Expo managed workflow. `react-native-fast-tflite` requires a bare workflow
with native build steps (Android/iOS) and is incompatible with Expo Go and managed builds.
HuggingFace Inference API provides equivalent classifier capability as a server-side call,
keeping the app dependency-free and Expo Go compatible.
