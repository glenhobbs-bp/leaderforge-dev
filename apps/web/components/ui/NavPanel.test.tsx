// Test component to validate database-driven navigation
'use client';

import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';

export function NavPanelTest({ contextKey }: { contextKey: string }) {
  const { navSchema, loading, error } = useNavigation(contextKey);

  if (loading) return <div>Loading navigation...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!navSchema) return <div>No navigation found</div>;

  return (
    <div>
      <h3>Database Navigation Test</h3>
      <pre>{JSON.stringify(navSchema, null, 2)}</pre>
    </div>
  );
}