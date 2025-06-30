"use client";

/**
 * Purpose: Test page for FormWidget component - Video Reflection Worksheet
 * Owner: Schema-Driven Forms Implementation
 * Tags: [test, forms, video-reflection, formwidget]
 */

import React from 'react';
import { FormWidget } from '../../components/forms/FormWidget';

export default function TestFormsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schema-Driven Forms Test
          </h1>
          <p className="text-gray-600">
            Testing the FormWidget component with video reflection worksheet
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <FormWidget
            templateId="663570eb-babd-41cd-9bfa-18972275863b"
            context={{
              video_id: "test-video-leadership-fundamentals",
              video_title: "Leadership Fundamentals: Building Trust",
              video_duration: "8:24"
            }}
            onSubmit={async (submissionData) => {
              console.log('✅ Form submitted successfully:', submissionData);
              alert(`Form submitted! Time spent: ${submissionData.timeSpent} minutes`);
            }}
            className="max-w-none"
          />
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Test Information:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Template: Video Reflection Worksheet</li>
            <li>• Template ID: 663570eb-babd-41cd-9bfa-18972275863b</li>
            <li>• Integration: Universal Input System</li>
            <li>• Context: Video metadata passed automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}