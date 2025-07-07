"use client";

// File: apps/web/components/ui/LegalTermsModal.tsx
// Purpose: Legal terms and conditions modal with premium glassmorphism styling
// Owner: Frontend Team
// Tags: UI, modal, legal, design-system, glassmorphism

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalTermsModal({ isOpen, onClose }: LegalTermsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-full mx-4 p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div
          className="relative rounded-2xl p-6 border border-white/20 max-h-[90vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 50%, rgba(241,245,249,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <DialogDescription className="sr-only">
            Legal terms and conditions for LeaderForge platform usage
          </DialogDescription>

                    {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-glass-primary mb-4">
              Terms of Service & Privacy Policy
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="space-y-4">
            {/* Terms of Service */}
            <section>
              <h3 className="text-sm font-medium text-glass-primary mb-2">Terms of Service</h3>
              <div className="space-y-2 text-xs text-glass-secondary">
                <p>
                  By using LeaderForge, you agree to these terms of service. LeaderForge is an AI-powered leadership development platform designed to help individuals and teams grow their leadership capabilities.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">Acceptable Use</h4>
                <p>
                  You agree to use LeaderForge in compliance with all applicable laws and regulations. You will not use the platform to engage in any illegal, harmful, or offensive activities.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">Account Responsibility</h4>
                <p>
                  You are responsible for maintaining the security of your account and all activities that occur under your account. Please notify us immediately of any unauthorized use.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">Intellectual Property</h4>
                <p>
                  All content and materials on LeaderForge are owned by LeaderForge or its licensors. You may not reproduce, distribute, or create derivative works without our express written permission.
                </p>
              </div>
            </section>

            {/* Privacy Policy */}
            <section>
              <h3 className="text-sm font-medium text-glass-primary mb-2">Privacy Policy</h3>
              <div className="space-y-2 text-xs text-glass-secondary">
                <p>
                  Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use LeaderForge.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">Information We Collect</h4>
                <p>
                  We collect information you provide directly to us, such as your name, email address, and profile information. We also collect usage data to improve our services.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">How We Use Your Information</h4>
                <p>
                  We use your information to provide and improve our services, communicate with you, and personalize your experience. We do not sell your personal information to third parties.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">Data Security</h4>
                <p>
                  We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.
                </p>

                <h4 className="font-medium text-glass-primary text-xs">Your Rights</h4>
                <p>
                  You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-sm font-medium text-glass-primary mb-2">Contact Us</h3>
              <div className="text-xs text-glass-secondary">
                <p>
                  If you have questions about these terms or our privacy practices, please contact us at:
                </p>
                <p className="mt-1">
                  <strong>Email:</strong> legal@leaderforge.com<br />
                  <strong>Address:</strong> LeaderForge, Inc.<br />
                  123 Leadership Lane<br />
                  Growth City, CA 94000
                </p>
              </div>
            </section>

            {/* Last Updated */}
            <section className="border-t border-white/20 pt-2">
              <p className="text-glass-muted text-xs">
                Last updated: January 15, 2024
              </p>
            </section>
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-white/20">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}