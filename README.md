# Britjoy English · inglés A1–C2 para hispanohablantes

A Duolingo-style web app that teaches English to Spanish speakers from A1 to C2,
guided by **Britjoy**, a cheerful British-style lion who gives tips, celebrates
wins and gently corrects mistakes.

React + Vite + TypeScript, Tailwind CSS and Zustand. No backend: all progress is
saved in `localStorage` (key `britjoy-english-progress-v1`).

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: answer checking, unlock rule, gamification, content validation
npm run build    # type-check + production build into dist/
```

## Publishing (GitHub Pages)

`.github/workflows/pages.yml` runs the tests, builds the app and deploys it to
GitHub Pages on every push to `main`. You can also run it from the Actions tab.
Before the first deploy, turn Pages on once: **Settings → Pages → Build and
deployment → Source: "GitHub Actions"**. Asset paths are relative
(`base: './'` in `vite.config.ts`), so the site works at
`https://<user>.github.io/<repo>/`.

## Android and iOS apps

The same code is packaged as native apps with [Capacitor](https://capacitorjs.com)
(`android/`, `ios/`, `capacitor.config.ts`). The app ID is
`com.workersvoiceuk.britjoyenglish`. Don't change it after the app has been
published in a store.

`.github/workflows/native.yml` tests and builds both apps on every push: unit
and Playwright end-to-end tests, an Android emulator run and an iPhone
simulator run, each with a screenshot. Each finished run under **Actions** has
these downloadable files:

- **`britjoy-english-android`**: `app-debug.apk`, which you can install
  directly on an Android phone. Allow "install unknown apps" for your browser
  or file manager.
- **`britjoy-english-ios-simulator`**: a build for the iOS Simulator on a Mac.
  A real iPhone or the App Store needs an Apple Developer account
  (99 USD/year) and code signing, which this repository doesn't contain.

Store releases (a signed Android AAB, and an iOS IPA that can optionally go to
TestFlight) come from `.github/workflows/release.yml`, which you run by hand. It
reads the signing keys from repository secrets. The step-by-step guide is
[`docs/PUBLICAR.md`](docs/PUBLICAR.md), and the store texts, screenshots and
graphics are in [`store/`](store/). No credentials are committed here.

In the apps, the listening exercises use the native text-to-speech plugin,
because Android's WebView has no `speechSynthesis`. The icon and splash
screens are generated from `assets/` with
`npx @capacitor/assets generate --android --ios`.

Local native development:

```sh
npm run build && npx cap sync   # copy the web build into android/ and ios/
npx cap open android            # Android Studio
npx cap open ios                # Xcode (macOS only)
```

## What's included

- **Placement quiz** (10 questions, A1→C2) on first launch. You can also skip
  it and start at A1. Every level up to the suggested one is unlocked.
- **Six levels**, each with its own accent colour. You can change level from the
  header button (`A1 ▾`).
- **Unlock rule:** a level unlocks once at least **80 % of the previous level's
  units** are complete (every lesson in a unit done). Inside a level, lessons
  are played in order.
- **Learning path:** winding lesson nodes that are locked, unlocked or completed
  (✓ plus 1–3 stars). Britjoy shows a tip for the next lesson.
- **Lessons** of 8–12 exercises with a progress bar and immediate green/red
  feedback. A wrong answer shows the correct one.
  - `multipleChoice`, `wordBank`, `listening` (speechSynthesis, en-GB, with a
    slow 🐢 button), `matching`, `typing`, `fillBlank`
  - Typing is tolerant of case, extra spaces, curly apostrophes and missing
    final punctuation. Word banks require the exact order, with optional
    `alternatives`.
  - Instructions are in Spanish for A1–B1 and in English for B2–C2.
- **Gamification:** 5 hearts (one lost per mistake; 0 hearts ends the lesson;
  +1 every 30 min), XP (10 per lesson + 1 per correct answer + 5 for a perfect
  lesson), a daily streak and a "lesson complete" screen.
- **Britjoy talks:** he introduces each lesson and reads every activity aloud.
  The voice is Spanish or English depending on the level, using the device's
  speech synthesiser or the native plugin in the apps. He reacts to answers, and
  in explanation cards he reads the key facts aloud. You can tap him to hear the
  text again.
- **Sounds:** synthesised with the Web Audio API, so there are no audio files.
  Lessons start with the Westminster chime, and there are sounds for correct and
  wrong answers, losing a heart and finishing a lesson. Voice and sounds can be
  switched off in **Ajustes**.
- **British design:** a navy, red and cream palette, bunting, unit titles styled
  as street signs, and a London skyline.
- **Sections** (bottom bar): Inglés, Vivir en UK, Recursos (British Council
  English Online, Busuu, LearnEnglish and official sites) and Ajustes (privacy
  policy and resetting progress).

### Vivir en UK

This is a practical course for newcomers, always open, and its lessons can be
taken in any order. It's in `src/data/courses/vivir-uk/`, one JSON file per
unit, registered in `index.ts`.

| Unit | Lessons |
|---|---|
| 🚆 Transporte | Paying for a journey (contactless/Oyster, touch in/out), the Overground lines, trains outside London |
| 🏥 Salud | Registering with a GP, booking an appointment, 111/999 and pharmacies, wellbeing (with a video) |
| 💷 Universal Credit | Who can claim, how to claim, payments/advances/journal |
| 🏠 Council Tax | What it is and who pays, discounts, paying and arrears |
| 🇬🇧 Vida en UK | Life in the UK test, share code for work (with a video), NI number/eVisa/bank, home and emergencies |
| 🇪🇸 Extra: España | NIE and TIE (with a video) |

Each lesson starts with `explain` cards that Britjoy reads aloud. A card has
key facts, English phrases you can tap to hear, a link to the official source
and, optionally, a video (`public/videos/`). Practice follows.

The facts were checked against GOV.UK on the date in each unit's `checked`
field. **Rules and amounts change: review this content regularly.**

### Current content

| Level | Units | Lessons | Topic |
|---|---|---|---|
| A1 | 2 | 10 | Greetings & introductions; numbers & age |
| A2 | 1 | 2 | Daily routine; past simple |
| B1 | 1 | 2 | Opinions; future plans |
| B2 | 1 | 2 | Conditionals; abstract nouns |
| C1 | 1 | 2 | Hedging; idioms |
| C2 | 1 | 2 | Register; near-synonyms & connotation |

Each lesson has 8 exercises. A1 is the most complete level. The higher levels
are starter samples: **C1/C2 content especially should be reviewed by a
qualified teacher** before real use.

## Project layout

```
src/
  data/
    courses/en-es/
      index.ts            ← the ONE registry of levels and units
      a1/unit-1.json …    ← one JSON file per unit
    placement.json        ← placement quiz questions
    britjoy-dialogue.json ← everything Britjoy says
  logic/                  ← pure, tested functions
    answer.ts             ← answer checking / tolerance
    unlock.ts             ← level + lesson unlock rules
    gamification.ts       ← hearts, streak, XP, stars
    placement.ts          ← level suggestion
  store/useProgressStore.ts ← Zustand store (persisted to localStorage)
  components/             ← UI (Britjoy.tsx, LearningPath, LessonScreen, exercises/…)
tests/                    ← Vitest
```

## Adding units and lessons

1. Create a JSON file in the level folder, e.g. `src/data/courses/en-es/a1/unit-3.json`:

   ```json
   {
     "level": "A1",
     "unit": "Unit 3",
     "title": "La familia",
     "lessons": [
       {
         "id": "a1-u3-l1",
         "title": "Mi familia",
         "tip": "Optional tip Britjoy shows before this lesson.",
         "exercises": [
           { "type": "multipleChoice", "prompt": "¿Cómo se dice «madre»?", "options": ["mother", "father", "sister"], "answer": "mother" }
         ]
       }
     ]
   }
   ```

2. Register it in `src/data/courses/en-es/index.ts`:

   ```ts
   import a1u3 from './a1/unit-3.json';
   // …
   units: [unit(a1u1), unit(a1u2), unit(a1u3)],
   ```

3. Run `npm test`. The content test checks every lesson: unique IDs, 8–12
   exercises, that each answer is among its options, that word-bank tiles can
   build the answer, and that every exercise can be solved.

Lesson IDs must be unique and start with the level (`a1-…`). Don't rename IDs
that are already published, because progress is stored by lesson ID.

To add a lesson, append it to the unit's `lessons` array. Aim for 5–8 lessons
per unit.

### Exercise reference

```jsonc
{ "type": "explain", "title": "…", "body": "Text\n• bullet", "say": "what Britjoy says (optional)",
  "phrases": [{ "en": "…", "es": "…" }], "link": { "label": "…", "url": "https://…" },
  "video": { "src": "videos/x.mp4", "poster": "videos/x.jpg", "caption": "…" } }   // not graded
{ "type": "multipleChoice", "prompt": "…", "options": ["…"], "answer": "…" }
{ "type": "wordBank", "prompt": "Spanish sentence", "words": ["tiles", "incl.", "distractors"], "answer": "English sentence.", "alternatives": ["Other order."] }
{ "type": "listening", "text": "Spoken English", "options": ["…"], "answer": "…" }   // with options → pick
{ "type": "listening", "text": "Spoken English", "answer": "…", "alternatives": [] } // without → type what you hear
{ "type": "matching", "prompt": "optional", "pairs": [{ "en": "one", "es": "uno" }] }
{ "type": "typing", "prompt": "Escribe en inglés: «…»", "answer": "…", "alternatives": ["…"] }
{ "type": "fillBlank", "sentence": "I ___ to the cinema.", "hint": "optional", "options": ["went", "go"], "answer": "went" } // omit options → typed
```

Guidelines for each level: A1–A2 use short sentences and Spanish prompts. From
B1 up, add `fillBlank` grammar. B2+ uses English prompts with longer sentences
and more complex structures.

## Adding a level

1. Create `src/data/courses/en-es/<level>/unit-1.json` with `"level": "<ID>"`.
2. Add a `LevelDefinition` to `LEVELS` in `src/data/courses/en-es/index.ts`
   (id, name, description, `accent`/`accentDark`/`accentLight` colours,
   `instructionLanguage: 'es' | 'en'`, `units`). Array order is unlock order.
3. Optionally add placement questions for it in `src/data/placement.json`.

No other code changes are needed. (The content test currently expects exactly
A1–C2, so update its first assertion if you add a level.)

## Britjoy's avatar

Britjoy is the owner's avatar: the Queen's Guard holding the *Life in the UK*
book, cut out from the owner's image into `src/assets/britjoy-avatar.webp`.
The whole app draws him through `src/components/Britjoy.tsx`, with an
`expression` prop (`happy | neutral | sad | celebrating`), a `size` prop
(height in px) and a `speaking` prop. Moods and talking are shown only with
movement; the artwork itself is never redrawn or recoloured.

To change the avatar, replace `britjoy-avatar.webp` with a PNG or WebP that has
a transparent background, update `ASPECT` in `Britjoy.tsx`, and regenerate the
icons and splash screens from `assets/` with
`npx @capacitor/assets generate --android --ios`.

## Editing Britjoy's dialogue

All of Britjoy's lines live in `src/data/britjoy-dialogue.json`: welcome,
placement, tips, correct/wrong reactions, lesson complete, out of hearts and so
on. Arrays are picked at random. `{level}`, `{previous}` and `{time}` are
placeholders.
