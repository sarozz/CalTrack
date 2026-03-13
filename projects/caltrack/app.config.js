// app.config.js lets us inject secrets via environment variables without committing them.
// Expo reads this at runtime when you start Metro.

const base = require('./app.json');

module.exports = ({ config }) => {
  const merged = { ...base.expo, ...config };

  // Inject USDA key from env var (do NOT commit secrets).
  merged.extra = {
    ...(merged.extra || {}),
    usdaApiKey: process.env.USDA_API_KEY || undefined,
  };

  return { expo: merged };
};
