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
