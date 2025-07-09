/**
 * Purpose: Prompt Contexts Page Wrapper - Renders the real functional page through the mockup system
 * Owner: Prompt Management System
 * Tags: [prompt-contexts, real-functionality, wrapper, agent-integration]
 */

"use client";

import React from 'react';

// Import the real functional page component
import PromptContextsPageReal from '../../app/context/preferences/page';

/**
 * Wrapper component that allows the agent system to render the real
 * Prompt Contexts page through the MockupRenderer system
 */
export default function PromptContextsPage() {
  return <PromptContextsPageReal />;
}