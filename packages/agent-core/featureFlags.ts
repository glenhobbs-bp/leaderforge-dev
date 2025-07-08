import { PostHog } from "posthog-node";

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://app.posthog.com";

export const client = POSTHOG_API_KEY
  ? new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })
  : null;

export async function isFeatureEnabled(
  flag: string,
  userId?: string,
  contextKey?: string,
): Promise<boolean> {
  if (!client) {
    return false;
  }

  const distinctId = userId || "anonymous";
  const properties: Record<string, unknown> = {};
  if (contextKey) properties.contextKey = contextKey;
  return await client.isFeatureEnabled(flag, distinctId, properties);
}

export async function getFeatureFlags(
  userId?: string,
  contextKey?: string,
): Promise<Record<string, boolean>> {
  const distinctId = userId || "anonymous";
  const properties: Record<string, unknown> = {};
  if (contextKey) properties.contextKey = contextKey;

  if (!client) {
    return {};
  }

  const flags = await client.getAllFlags(distinctId, properties);

  // Convert FeatureFlagValue to boolean
  const booleanFlags: Record<string, boolean> = {};
  Object.entries(flags).forEach(([key, value]) => {
    booleanFlags[key] = Boolean(value);
  });

  return booleanFlags;
}
