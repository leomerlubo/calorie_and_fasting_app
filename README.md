<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DmQ1GyZXjiWIK6kC0xF6Ty7IutEiuIz2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android Studio (Capacitor)

You can wrap this web app for Android Studio using Capacitor.

1. Install Capacitor dependencies:
   `npm install`
2. Build the web app:
   `npm run build`
3. Add the Android platform (first time only):
   `npx cap add android`
4. Sync web assets into the native project:
   `npm run cap:sync`
5. Open the Android project in Android Studio:
   `npm run cap:open:android`

After the first setup, you can repeat steps 2, 4, and 5 whenever the web app changes.
