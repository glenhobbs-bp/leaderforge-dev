"use client";

/**
 * Purpose: Client component for CopilotKit testing
 * Owner: CopilotKit Integration
 * Tags: [copilotkit, test, client]
 */

import React from 'react';

export default function CopilotKitClient() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CopilotKit Test (Server Protected)
          </h1>
          <p className="text-gray-600">
            This page is now protected by server-side authentication
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <div className="text-green-600 text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Authentication Success
            </h2>
            <p className="text-gray-600">
              You can only see this page because you are properly authenticated.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Security Information:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Server-side authentication check implemented</li>
            <li>• No content served without valid session</li>
            <li>• Redirects to /login if unauthenticated</li>
          </ul>
        </div>
      </div>
    </div>
  );
}