/**
 * Purpose: Prompt Contexts Page Wrapper - Renders the client component through the mockup system
 * Owner: Prompt Management System
 * Tags: [prompt-contexts, real-functionality, wrapper, agent-integration]
 */

"use client";

import React from 'react';

// Import the client component instead of the server component
import ContextPreferencesClient from '../../app/context/preferences/ContextPreferencesClient';

/**
 * Wrapper component that allows the agent system to render the
 * Prompt Contexts page through the MockupRenderer system
 * Note: This bypasses server-side authentication for mockup purposes
 */
export default function PromptContextsPage() {
  return <ContextPreferencesClient />;
}