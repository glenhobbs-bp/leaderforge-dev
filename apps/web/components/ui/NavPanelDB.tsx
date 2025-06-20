'use client';

import React from 'react';
import { useNavigation } from '../../hooks/useNavigation';

interface NavPanelDBProps {
  contextKey: string;
}

export function NavPanelDB({ contextKey }: NavPanelDBProps) {
  const { navSchema, loading, error } = useNavigation(contextKey);

  if (loading) {
    return (
      <div className="w-64 h-full bg-white/40 backdrop-blur-xl rounded-2xl p-4">
        <div className="animate-pulse">Loading navigation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 h-full bg-white/40 backdrop-blur-xl rounded-2xl p-4">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!navSchema) {
    return (
      <div className="w-64 h-full bg-white/40 backdrop-blur-xl rounded-2xl p-4">
        <div>No navigation found</div>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-white/40 backdrop-blur-xl rounded-2xl p-4">
      <h3 className="font-semibold mb-4">Database Navigation</h3>

      {navSchema.props.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-6">
          {section.title && (
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              {section.title}
            </h4>
          )}

          <div className="space-y-1">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/50 cursor-pointer"
                onClick={() => console.log('Nav clicked:', item.id)}
              >
                {item.icon && (
                  <span className="text-gray-500">📄</span>
                )}
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}