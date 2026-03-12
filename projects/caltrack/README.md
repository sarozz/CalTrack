# CalTrack (V1 demo)

Expo React Native demo app for quick calorie + protein tracking.

## Run

```bash
cd /Users/saroj/.openclaw/workspace/projects/caltrack
npm install
npm run start
# then press i / a in the Expo CLI (or run the commands below)
npm run ios
npm run android
npm run web
```

## Features (for tonight demo)

- Bottom tabs: **Home / Log (+) / History**
- **Settings** (Home header button)
  - Calories goal, protein goal
  - Wake/sleep time (stored)
  - Reminder mode (stored; no push notifications yet)
- **Log**
  - Text mode
  - Emoji tag required (16 emojis grouped)
  - Caption optional
  - Auto meal detect from time + manual override
  - Lightweight parsing: supports inputs like `650c 30p` (auto-fills fields if empty)
  - Manual calories/protein fields always available
  - Save updates Home totals + today feed (via focus refresh)
- **History**
  - Day list with totals
  - Day detail with entries + totals

## Data

Stored locally on device via AsyncStorage:
- `caltrack_entries_v1`
- `caltrack_settings_v1`
