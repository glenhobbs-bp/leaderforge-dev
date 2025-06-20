'use client';

import { NavPanelDB } from '../../components/ui/NavPanelDB';

export default function TestNavDBPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Database-Driven Navigation Test</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">LeaderForge Context</h2>
            <NavPanelDB contextKey="leaderforge" />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Brilliant Context</h2>
            <NavPanelDB contextKey="brilliant" />
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Test Objectives:</h3>
          <ul className="mt-2 text-blue-700 space-y-1">
            <li>✅ Database-driven navigation loads from nav_options table</li>
            <li>✅ Entitlement filtering applied automatically</li>
            <li>✅ No arbitrary navSchema props bypassing security</li>
            <li>✅ Loading and error states handled gracefully</li>
          </ul>
        </div>
      </div>
    </div>
  );
}