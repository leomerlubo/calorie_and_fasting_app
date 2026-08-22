# My Wellness

A mobile-first wellness tracker rebuilt from scratch for calories, activity, fasting and a simple timer.

## Features

- Email/password and Google sign-in via Supabase Auth
- Profile, BMR and TDEE calculation
- Suggested or custom calorie goal
- Daily food and activity logging
- Saved food menus
- Searchable activity catalog with estimated calorie burn
- Historical date navigation and edit/delete logs
- Fasting sessions, milestones, longest fast and total fasting time
- Timezone, hashtag and color customization
- Lightweight timer
- Capacitor Android packaging

## Local setup

1. Copy `.env.example` to `.env`.
2. Add a Supabase project URL and publishable key.
3. Run the SQL in `supabase/schema.sql` in a fresh Supabase project.
4. Enable Email/Password and Google in Supabase Auth.
5. `npm install`
6. `npm run dev`

Without Supabase variables, the project still builds and uses a local preview store for UI development. Production should use Supabase.

## Android

After dependencies are installed:

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Use a release keystore for production distribution. Do not commit keystores or secret keys.

## Security

The browser/mobile client uses only the Supabase publishable key. The schema enables RLS on every user table and restricts rows to `auth.uid() = user_id`.
