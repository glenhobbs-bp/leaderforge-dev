/**
 * File: apps/web/src/components/content/reflection-modal.tsx
 * Purpose: Modal for capturing reflection when completing a bold action
 * Owner: LeaderForge Team
 */

'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  boldActionText: string;
  onSubmit: (reflection: ReflectionData) => Promise<void>;
}

export interface ReflectionData {
  completionStatus: 'fully' | 'partially' | 'blocked';
  reflectionText: string;
  challengeLevel: number | null;
  wouldRepeat: 'yes' | 'maybe' | 'no' | null;
}

const completionStatuses = [
  {
    value: 'fully' as const,
    label: 'Fully completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
    selectedBg: 'bg-green-100 border-green-500',
  },
  {
    value: 'partially' as const,
    label: 'Partially completed',
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    selectedBg: 'bg-amber-100 border-amber-500',
  },
  {
    value: 'blocked' as const,
    label: 'Blocked / Unable',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
    selectedBg: 'bg-red-100 border-red-500',
  },
];

const challengeLevels = [
  { value: 1, emoji: '😌', label: 'Easy' },
  { value: 2, emoji: '💪', label: 'Moderate' },
  { value: 3, emoji: '🔥', label: 'Hard' },
  { value: 4, emoji: '🌋', label: 'Very Hard' },
];

const wouldRepeatOptions = [
  { value: 'yes' as const, emoji: '👍', label: 'Yes, valuable' },
  { value: 'maybe' as const, emoji: '🤷', label: 'Maybe' },
  { value: 'no' as const, emoji: '👎', label: 'Not worth it' },
];

export function ReflectionModal({
  isOpen,
  onClose,
  boldActionText,
  onSubmit,
}: ReflectionModalProps) {
  const [completionStatus, setCompletionStatus] = useState<'fully' | 'partially' | 'blocked' | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [challengeLevel, setChallengeLevel] = useState<number | null>(null);
  const [wouldRepeat, setWouldRepeat] = useState<'yes' | 'maybe' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!completionStatus) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        completionStatus,
        reflectionText,
        challengeLevel,
        wouldRepeat,
      });
      // Reset form
      setCompletionStatus(null);
      setReflectionText('');
      setChallengeLevel(null);
      setWouldRepeat(null);
      onClose();
    } catch (error) {
      console.error('Error submitting reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            🎯 Complete Bold Action
          </DialogTitle>
          <DialogDescription className="text-base">
            Close the loop on your commitment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bold Action Display */}
          <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
            <p className="text-sm text-muted-foreground mb-1">Your commitment:</p>
            <p className="font-medium">&quot;{boldActionText}&quot;</p>
          </div>

          {/* Completion Status (Required) */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              How did it go? <span className="text-red-500">*</span>
            </Label>
            <div className="grid gap-2">
              {completionStatuses.map((status) => {
                const Icon = status.icon;
                const isSelected = completionStatus === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => setCompletionStatus(status.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected ? status.selectedBg : status.bgColor
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${status.color}`} />
                    <span className="font-medium">{status.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Reflection (Optional) */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Quick reflection <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="What did you learn from doing this? Any insights or surprises?"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Challenge Level (Optional) */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Challenge level <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="flex gap-2">
              {challengeLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setChallengeLevel(level.value === challengeLevel ? null : level.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    challengeLevel === level.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/30 border-transparent hover:bg-muted/50'
                  }`}
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-xs text-muted-foreground">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Would Repeat (Optional) */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Would you do this again? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="flex gap-2">
              {wouldRepeatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setWouldRepeat(option.value === wouldRepeat ? null : option.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    wouldRepeat === option.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/30 border-transparent hover:bg-muted/50'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!completionStatus || isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Mark Complete →'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

