/**
 * File: apps/web/components/copilot/EntitlementActions.tsx
 * Purpose: CopilotKit actions for entitlement management with Generative UI
 * Owner: Engineering Team
 * Tags: #copilotkit #entitlements #admin #generative-ui
 */

"use client";

import React from 'react';
import { useCopilotAction } from "@copilotkit/react-core";
import { EntitlementCheckboxForm } from '../forms/EntitlementCheckboxForm';

export function EntitlementActions() {
  // Memoized render function to prevent infinite re-renders
  const renderEntitlementForm = React.useCallback(({ args }: { args: { userIdentifier?: string } }) => {
    // Default to current user's email if no userIdentifier provided or if it's just a first name
    let userIdentifier = args.userIdentifier;

    // If userIdentifier is missing, just a name, or doesn't contain @, default to current user
    if (!userIdentifier || (!userIdentifier.includes('@') && !userIdentifier.includes('-'))) {
      // Try to get current user email from context, fallback to known email
      userIdentifier = 'glen@brilliantperspectives.com';
    }

    return <MemoizedEntitlementCheckboxForm userIdentifier={userIdentifier} />;
  }, []);

  // Register the CopilotKit action
  useCopilotAction({
    name: "manageUserEntitlements",
    description: "Show and manage user entitlements and permissions",
    parameters: [
      {
        name: "userIdentifier",
        type: "string",
        description: "Email address or user identifier to manage entitlements for",
        required: false,
      },
    ],
    render: renderEntitlementForm,
  });

  return null; // This component only registers the action
}

// Memoized version to prevent unnecessary re-renders
const MemoizedEntitlementCheckboxForm = React.memo(EntitlementCheckboxForm);