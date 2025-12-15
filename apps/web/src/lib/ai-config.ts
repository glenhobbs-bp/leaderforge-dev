/**
 * File: src/lib/ai-config.ts
 * Purpose: Utility functions for fetching AI configurations
 * Owner: LeaderForge Team
 * 
 * Part of 7.9 AI Configuration - Platform-level prompt management
 */

import { createClient } from '@/lib/supabase/server';

export interface AIConfigValue {
  system?: string;
  tone?: string;
  focus?: string[];
  templates?: string[];
  conditions?: Record<string, string>;
  [key: string]: unknown;
}

export interface AIConfig {
  config_key: string;
  config_value: AIConfigValue;
  model: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
}

// Cache for configs (simple in-memory, refreshed on server restart)
const configCache = new Map<string, { config: AIConfig; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get an AI configuration by key
 * Falls back to default if not found or inactive
 */
export async function getAIConfig(
  configKey: string,
  defaultValue?: AIConfigValue
): Promise<AIConfig | null> {
  // Check cache
  const cached = configCache.get(configKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  try {
    const supabase = await createClient();
    
    const { data: config, error } = await supabase
      .schema('core')
      .from('ai_config')
      .select('config_key, config_value, model, max_tokens, temperature, is_active')
      .eq('config_key', configKey)
      .eq('is_active', true)
      .single();

    if (error || !config) {
      console.log(`[AI Config] Config not found for key: ${configKey}, using default`);
      if (defaultValue) {
        return {
          config_key: configKey,
          config_value: defaultValue,
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          temperature: 0.7,
          is_active: true,
        };
      }
      return null;
    }

    // Cache the result
    configCache.set(configKey, { config: config as AIConfig, timestamp: Date.now() });

    return config as AIConfig;
  } catch (error) {
    console.error(`[AI Config] Error fetching config for ${configKey}:`, error);
    if (defaultValue) {
      return {
        config_key: configKey,
        config_value: defaultValue,
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.7,
        is_active: true,
      };
    }
    return null;
  }
}

/**
 * Get multiple AI configurations at once
 */
export async function getAIConfigs(configKeys: string[]): Promise<Map<string, AIConfig>> {
  const result = new Map<string, AIConfig>();
  
  try {
    const supabase = await createClient();
    
    const { data: configs, error } = await supabase
      .schema('core')
      .from('ai_config')
      .select('config_key, config_value, model, max_tokens, temperature, is_active')
      .in('config_key', configKeys)
      .eq('is_active', true);

    if (error) {
      console.error('[AI Config] Error fetching configs:', error);
      return result;
    }

    for (const config of configs || []) {
      result.set(config.config_key, config as AIConfig);
      // Cache each config
      configCache.set(config.config_key, { config: config as AIConfig, timestamp: Date.now() });
    }
  } catch (error) {
    console.error('[AI Config] Error fetching configs:', error);
  }

  return result;
}

/**
 * Get terminology mapping (with defaults)
 */
export async function getTerminology(): Promise<Record<string, string>> {
  const defaultTerms = {
    bold_action: 'Bold Action',
    check_in: 'Check-in',
    module: 'Module',
    worksheet: 'Worksheet',
    team_leader: 'Team Leader',
    learner: 'Learner',
  };

  const config = await getAIConfig('terminology_default', defaultTerms);
  return (config?.config_value as Record<string, string>) || defaultTerms;
}

/**
 * Clear the config cache (useful after updates)
 */
export function clearAIConfigCache(configKey?: string) {
  if (configKey) {
    configCache.delete(configKey);
  } else {
    configCache.clear();
  }
}
