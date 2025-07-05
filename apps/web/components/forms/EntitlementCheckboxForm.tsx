/**
 * File: apps/web/components/forms/EntitlementCheckboxForm.tsx
 * Purpose: Interactive checkbox form for managing user entitlements in CopilotKit
 * Owner: Engineering Team
 * Tags: #copilotkit #forms #entitlements #admin
 *
 * CRITICAL DISTINCTION: Two Types of Entitlements
 *
 * 1. ADMIN PERMISSIONS (Authorization)
 *    - Question: "Can the current user manage entitlements?"
 *    - Examples: is_super_admin, platform_admin, tenant_admin
 *    - Purpose: Controls WHO can access this form
 *    - Checked in: /api/admin/entitlements/list endpoint before returning data
 *
 * 2. TARGET USER ENTITLEMENTS (Business Logic)
 *    - Question: "What entitlements does the target user have?"
 *    - Examples: leaderforge-premium, basic-access, content-library-access
 *    - Purpose: The checkboxes shown in this form, what gets granted/revoked
 *    - Displayed as: availableEntitlements (all possible) vs currentEntitlements (user has)
 *
 * This form displays #2 (target user entitlements) after #1 (admin permissions) are verified by the API.
 */

"use client";

import { useState, useEffect, useMemo } from 'react';

interface Entitlement {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface EntitlementCheckboxFormProps {
  userIdentifier: string;
}

export function EntitlementCheckboxForm({ userIdentifier }: EntitlementCheckboxFormProps) {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [currentEntitlements, setCurrentEntitlements] = useState<string[]>([]);
  const [selectedEntitlements, setSelectedEntitlements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize whether the userIdentifier is valid to prevent unnecessary re-renders
  const isValidUserIdentifier = useMemo(() => {
    return userIdentifier &&
           userIdentifier.length >= 25 && // Require much longer length to avoid partial emails
           userIdentifier.includes('@') &&
           userIdentifier.includes('.'); // Require both @ and . for valid email
  }, [userIdentifier]);

  // Load entitlements and current user entitlements
  useEffect(() => {
    // Skip if userIdentifier is invalid
    if (!isValidUserIdentifier) {
      console.log(`[EntitlementCheckboxForm] Skipping load for invalid userIdentifier: "${userIdentifier}" (length: ${userIdentifier?.length || 0})`);
      setLoading(false);
      setError('Invalid user identifier');
      return;
    }

    const loadEntitlements = async () => {
      try {
        console.log(`[EntitlementCheckboxForm] Loading entitlements for: "${userIdentifier}"`);
        setLoading(true);
        setError(null);

        // Fetch available entitlements and current user entitlements
        const response = await fetch('/api/admin/entitlements/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIdentifier }),
        });

        if (!response.ok) {
          throw new Error('Failed to load entitlements');
        }

        const data = await response.json();
        setEntitlements(data.available || []);
        setCurrentEntitlements(data.current || []);
        setSelectedEntitlements(data.current || []);
        console.log(`[EntitlementCheckboxForm] Successfully loaded ${data.available?.length || 0} entitlements`);
      } catch (err) {
        console.error(`[EntitlementCheckboxForm] Error loading entitlements:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load entitlements');
      } finally {
        setLoading(false);
      }
    };

    loadEntitlements();
  }, [userIdentifier, isValidUserIdentifier]);

  // Handle checkbox changes
  const handleCheckboxChange = (entitlementId: string, checked: boolean) => {
    setSelectedEntitlements(prev => {
      if (checked) {
        return [...prev, entitlementId];
      } else {
        return prev.filter(id => id !== entitlementId);
      }
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/entitlements/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIdentifier,
          entitlements: selectedEntitlements,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update entitlements');
      }

            await response.json();

      // Update current entitlements to reflect changes
      setCurrentEntitlements(selectedEntitlements);

      // Show success message
      alert(`Successfully updated entitlements for ${userIdentifier}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entitlements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading entitlements...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="text-red-700">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  console.log(`[EntitlementCheckboxForm] Rendering form with ${entitlements.length} entitlements, ${selectedEntitlements.length} selected`);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm max-w-2xl">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Configure Entitlements for {userIdentifier}
      </h3>

                  {/* Combined selection counter + submit button */}
      <div className="mb-3">
        <div className="bg-blue-50 p-3 rounded border">
          <div className="text-sm text-gray-700 font-medium text-center mb-2">
            {selectedEntitlements.length} of {entitlements.length} entitlements selected
          </div>

          <div
            onClick={handleSubmit}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-2 font-bold rounded transition-colors cursor-pointer bg-green-600 hover:bg-green-700 text-white"
            style={{
              minHeight: '40px',
              fontSize: '14px',
              textAlign: 'center',
              lineHeight: '40px',
              opacity: loading ? '0.5' : '1'
            }}
          >
            {loading ? '⏳ Updating...' : '💾 Save Changes'}
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 p-2 rounded">
        {entitlements.map((entitlement) => {
          const isSelected = selectedEntitlements.includes(entitlement.id);
          const wasOriginallySelected = currentEntitlements.includes(entitlement.id);

          return (
            <div key={entitlement.id} className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={`entitlement-${entitlement.id}`}
                checked={isSelected}
                onChange={(e) => handleCheckboxChange(entitlement.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor={`entitlement-${entitlement.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium text-gray-900">
                  {entitlement.display_name}
                  {wasOriginallySelected && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Currently Assigned
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {entitlement.description}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {entitlement.id}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-500">
        Debug: {entitlements.length} total, {selectedEntitlements.length} selected, loading: {loading.toString()}
      </div>
    </div>
  );
}