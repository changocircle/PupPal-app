/**
 * app.config.js — Dynamic Expo config
 *
 * Replaces app.json so we can inject environment variables at build time.
 * EAS secrets / local .env values are read via process.env here.
 *
 * Required env var:
 *   EXPO_PUBLIC_SENTRY_DSN  — Sentry DSN for error tracking
 *                             Format: https://<key>@<org>.ingest.sentry.io/<project-id>
 *                             Set in EAS: eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value <dsn>
 *                             Set locally: add to .env (see .env.example)
 */

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    '@sentry/react-native',
  ],
  extra: {
    ...config.extra,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
    EXPO_PUBLIC_POSTHOG_HOST:
      process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  },
});
