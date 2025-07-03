/**
 * File: apps/web/app/admin/page.tsx
 * Purpose: Admin interface with CopilotKit integration
 * Owner: Engineering Team
 * Tags: #admin #copilotkit #ui
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { UniversalSchemaRenderer } from '../../components/ai/UniversalSchemaRenderer';
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import type { AdminUISchema } from 'agent-core/types/AdminUISchema';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<AdminUISchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check admin status on mount
  useEffect(() => {
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();

      console.log('[Admin Page] Current user:', user);
      console.log('[Admin Page] User metadata:', user?.user_metadata);

      if (!user) {
        router.push('/login');
        return;
      }

      // Check admin status from user metadata
      // Supabase stores custom metadata in user_metadata during auth
      const metadata = user.user_metadata || {};
      const isAdminUser = metadata.is_admin === true;

      console.log('[Admin Page] Is admin?', isAdminUser);

      if (!isAdminUser) {
        console.log('User is not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdminStatus();
  }, [router]);

  // Make admin context readable to CopilotKit
  useCopilotReadable({
    description: 'Admin capabilities and current state',
    value: {
      isAdmin,
      currentTaskId: currentSchema?.id,
      capabilities: [
        'Configure user entitlements',
        'Create new tenant',
        'Change theme colors'
      ]
    }
  });

  // Handle schema updates from the admin agent
  useCopilotAction({
    name: "updateAdminUI",
    description: "Update the admin UI with a new schema",
    parameters: [
      {
        name: "schema",
        type: "object",
        description: "The UI schema to render",
        required: true,
      },
      {
        name: "error",
        type: "string",
        description: "Error message if any",
        required: false,
      }
    ],
    handler: async ({ schema, error: errorMsg }) => {
      if (errorMsg) {
        setError(errorMsg);
        return;
      }

      setError(null);
      setCurrentSchema(schema as AdminUISchema);
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Console</h1>
            <p className="text-sm text-gray-600 mt-1">
              Use the chat to manage entitlements, create tenants, or configure themes
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {currentSchema ? (
            <div className="max-w-4xl mx-auto">
              <UniversalSchemaRenderer
                schema={currentSchema}
                onAction={(action) => {
                  // Handle form submission through action
                  if (action.action === 'submit') {
                    // The CopilotKit action will handle this
                    console.log('Form submitted:', action);
                  }
                }}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center py-12">
              <h2 className="text-xl font-medium text-gray-700 mb-4">
                Welcome to the Admin Console
              </h2>
              <p className="text-gray-600 mb-8">
                Start a conversation in the chat to perform administrative tasks:
              </p>
              <ul className="text-left inline-block space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Configure user entitlements (e.g., &ldquo;Give user123 premium access&rdquo;)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Create new tenants (e.g., &ldquo;Create a tenant named Acme Corp&rdquo;)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Update theme colors (e.g., &ldquo;Change primary color to #FF6B6B&rdquo;)</span>
                </li>
              </ul>
            </div>
          )}
        </main>
      </div>

      {/* CopilotKit Chat Sidebar */}
      <div className="w-96 border-l bg-white">
        <CopilotChat
          labels={{
            title: "Admin Assistant",
            initial: "Hello! I can help you with admin tasks like managing entitlements, creating tenants, or updating themes. What would you like to do?"
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}