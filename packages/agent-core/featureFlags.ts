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
  const distinctId = userId || "anonymous";
  const properties: Record<string, any> = {};
  if (contextKey) properties.contextKey = contextKey;
  return await client.isFeatureEnabled(flag, distinctId, properties);
}

export async function getFeatureFlags(
  userId?: string,
  contextKey?: string,
): Promise<Record<string, boolean>> {
  const distinctId = userId || "anonymous";
  const properties: Record<string, any> = {};
  if (contextKey) properties.contextKey = contextKey;
  return await client.getAllFlags(distinctId, properties);
}
