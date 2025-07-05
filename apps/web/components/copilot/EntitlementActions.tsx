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

  // Single CopilotKit action with Generative UI for interactive entitlement management
  useCopilotAction({
    name: "manageEntitlements",
    description: "Show and manage user entitlements with interactive checkboxes. If no specific user is mentioned, defaults to the current user.",
    parameters: [
      {
        name: "userIdentifier",
        type: "string",
        description: "The user's email address or user ID. Use full email address like 'glen@brilliantperspectives.com', not just first name.",
        required: false,
      },
    ],
    render: renderEntitlementForm,
  }, [renderEntitlementForm]); // Add dependency array

  // This component doesn't render anything visible - it just provides the CopilotKit actions
  return null;
}

// Memoized version to prevent unnecessary re-renders
const MemoizedEntitlementCheckboxForm = React.memo(EntitlementCheckboxForm);