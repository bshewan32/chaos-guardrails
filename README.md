# Chaos with Guardrails

A React Native (Expo) mobile app for intelligent, adaptive strength training. Structured unpredictability — track what matters, train what needs work.

## Philosophy

The app tracks muscle groups both directly and indirectly through fractional contribution weights. Each session is built by scoring every exercise against what your muscles need most this week, then applying a set of guardrails:

- **Axial load budget** — limits heavy spinal loading per session (with a 15% stochastic override for occasional higher-load sessions)
- **Posterior chain bias** — hip-dominant work is weighted more heavily by design
- **Stochastic shuffle** — final exercise order is randomised so no two sessions feel the same
- **The Nudge** — when you are within 2 sets of completing a muscle group mid-session, the app surfaces a quick finisher card
- **Finish Week** — at the end of a completed session, if all primary muscles are within 2 sets of their target, the app shows what it would take to close out the week

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 55 + React Native 0.83 |
| Language | TypeScript (strict) |
| Navigation | Expo Router v4 |
| State | Zustand + AsyncStorage persistence |
| Styling | NativeWind v4 + StyleSheet |
| SVG | react-native-svg |
| Gestures | react-native-gesture-handler |
| Animation | react-native-reanimated |
| Build | EAS Build |

## Project Structure

```
chaos-guardrails/
├── app/
│   ├── _layout.tsx              Root layout + onboarding gate
│   ├── onboarding.tsx           4-step onboarding + target selector
│   ├── session-builder.tsx      Session preview + edit + start
│   ├── active-session.tsx       Live session with set dots + nudge + finish-week
│   └── (tabs)/
│       ├── _layout.tsx          Tab bar + persistent FAB
│       ├── index.tsx            Today — rings, grade, category cards
│       ├── history.tsx          History — mesocycle grid, stats, achievements
│       └── you.tsx              You — target selector, data export, FAQ
├── src/
│   ├── engine/
│   │   ├── volume.ts            Weekly volume calculation
│   │   ├── grades.ts            Grade computation (D–S) + mesocycle processing
│   │   ├── priority.ts          Muscle priority scoring
│   │   ├── recommendations.ts   Smart exercise recommendations
│   │   ├── variantSelector.ts   Week-seeded deterministic variant rotation
│   │   ├── sessionBuilder.ts    Full session builder with all guardrails
│   │   ├── nudge.ts             Nudge trigger detection
│   │   ├── finishWeek.ts        Finish-week trigger detection
│   │   ├── stats.ts             Stats + achievements + personal bests
│   │   └── index.ts             Barrel export
│   ├── data/
│   │   └── exercises.ts         Full exercise library with fractional muscle weights
│   ├── store/
│   │   └── workoutStore.ts      Zustand store — single source of truth
│   ├── components/
│   │   ├── ProgressRing.tsx     SVG arc ring with muscle label
│   │   ├── GradeBadge.tsx       Grade letter badge (D–S)
│   │   ├── CategoryCard.tsx     Expandable movement category card
│   │   ├── ExerciseLogCard.tsx  Exercise card with variant chips + stepper
│   │   └── NudgeCard.tsx        Inline nudge suggestion card
│   └── theme/
│       └── index.ts             Colours, spacing, radius, font sizes
├── eas.json                     EAS Build configuration
└── tailwind.config.js           NativeWind/Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- Expo Go app on your device, or a simulator

### Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Building for Distribution

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo account
eas login

# Build for TestFlight (iOS internal)
eas build --platform ios --profile preview

# Build APK for Android internal testing
eas build --platform android --profile preview

# Build production bundles for both stores
eas build --platform all --profile production
```

### Submitting to Stores

Before submitting, update `eas.json` with your Apple ID, App Store Connect App ID, Apple Team ID, and Google Service Account key path.

```bash
# Submit to App Store
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

## Algorithm Overview

### Volume Calculation

Each exercise contributes fractional effective sets to each muscle group. For example, a Bent-Over Row contributes 1.0 sets to upper back, 0.6 to lats, and 0.3 to biceps per logged set. Bonus exercises (`isBonus: true`) are excluded from volume calculations.

### Priority Scoring

```
priority = remaining × (isPrimary ? 2 : 1) + (chronicDeficit ? 5 : 0)
```

Chronic deficit: a primary muscle whose 6-week average volume is below 80% of the weekly target.

### Session Builder

1. Score all compound exercises against top-priority muscles
2. Apply axial budget (max 1 high-axial, max 2 moderate-axial, max 1 high-erector per session — with 15% stochastic override on high-axial)
3. Cap posterior chain at 2 exercises per session
4. Inject missing movement categories for diversity
5. Stochastic Fisher-Yates shuffle of final order
6. 35% chance of an accessory finisher for the top-need accessory muscle

### Grade Scale

| Grade | Condition |
|---|---|
| S | 100% avg or all 6 primary muscles hit |
| A | ≥80% avg or ≥5 muscles hit |
| B | ≥65% avg or ≥4 muscles hit |
| C | ≥50% avg or ≥3 muscles hit |
| D | Below all thresholds |

The grade drives the app's accent colour: D=red, C=orange, B=yellow, A=green, S=teal.
