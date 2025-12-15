/**
 * File: apps/web/src/components/content/reflection-modal.tsx
 * Purpose: Modal for capturing reflection when completing a bold action
 * Owner: LeaderForge Team
 * 
 * Enhanced with AI-powered context-aware reflection prompts (7.5)
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
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
  contentId: string;
  onSubmit: (reflection: ReflectionData) => Promise<void>;
}

interface AIPrompts {
  primaryPrompt: string;
  followUpPrompts: string[];
  encouragement: string;
  isAIGenerated: boolean;
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

// Default prompts (fallback)
const DEFAULT_PROMPTS: Record<string, AIPrompts> = {
  fully: {
    primaryPrompt: "What did you learn about yourself while completing this bold action?",
    followUpPrompts: [
      "What was the most surprising or unexpected part?",
      "How might you apply what you learned elsewhere?",
    ],
    encouragement: "Great job completing your bold action!",
    isAIGenerated: false,
  },
  partially: {
    primaryPrompt: "What progress did you make, and what held you back?",
    followUpPrompts: [
      "What would need to change for full completion next time?",
      "What did you learn from the parts you did complete?",
    ],
    encouragement: "Partial progress is still progress!",
    isAIGenerated: false,
  },
  blocked: {
    primaryPrompt: "What obstacles prevented you from taking action?",
    followUpPrompts: [
      "Were these obstacles within your control?",
      "Is there a smaller version that might be more achievable?",
    ],
    encouragement: "Understanding what blocks us helps us grow.",
    isAIGenerated: false,
  },
};

export function ReflectionModal({
  isOpen,
  onClose,
  boldActionText,
  contentId,
  onSubmit,
}: ReflectionModalProps) {
  const [completionStatus, setCompletionStatus] = useState<'fully' | 'partially' | 'blocked' | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [challengeLevel, setChallengeLevel] = useState<number | null>(null);
  const [wouldRepeat, setWouldRepeat] = useState<'yes' | 'maybe' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI Prompts state
  const [aiPrompts, setAiPrompts] = useState<AIPrompts | null>(null);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // Fetch AI prompts when completion status changes
  useEffect(() => {
    if (!completionStatus || !isOpen) {
      setAiPrompts(null);
      return;
    }

    // Capture the status value for use in async function
    const status = completionStatus;

    async function fetchPrompts() {
      setIsLoadingPrompts(true);
      try {
        const response = await fetch('/api/reflection-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            boldActionText,
            completionStatus: status,
          }),
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setAiPrompts(result.data);
        } else {
          // Use fallback prompts
          setAiPrompts(DEFAULT_PROMPTS[status]);
        }
      } catch (error) {
        console.error('Failed to fetch AI prompts:', error);
        setAiPrompts(DEFAULT_PROMPTS[status]);
      } finally {
        setIsLoadingPrompts(false);
      }
    }

    fetchPrompts();
  }, [completionStatus, isOpen, contentId, boldActionText]);

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

          {/* AI-Enhanced Reflection Section */}
          {completionStatus && (
            <div className="space-y-3 bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
              {/* Encouragement */}
              {isLoadingPrompts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating personalized prompts...</span>
                </div>
              ) : aiPrompts && (
                <>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    {aiPrompts.isAIGenerated && <Sparkles className="h-4 w-4" />}
                    <span className="font-medium">{aiPrompts.encouragement}</span>
                  </div>
                  
                  {/* Primary Prompt */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      {aiPrompts.isAIGenerated && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">AI</span>
                      )}
                      {aiPrompts.primaryPrompt}
                    </Label>
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      className="min-h-[80px] resize-none bg-background"
                    />
                  </div>

                  {/* Follow-up prompts as hints */}
                  {aiPrompts.followUpPrompts.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium">Consider also:</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {aiPrompts.followUpPrompts.map((prompt, i) => (
                          <li key={i}>{prompt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Fallback when no status selected */}
          {!completionStatus && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Quick reflection <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                placeholder="Select a completion status above to get personalized reflection prompts..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled
              />
            </div>
          )}

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

