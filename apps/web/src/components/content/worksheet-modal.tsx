/**
 * File: src/components/content/worksheet-modal.tsx
 * Purpose: Modal for completing worksheets with Bold Action commitment
 * Owner: Core Team
 * 
 * Part of 4-step module completion:
 * 1. Watch Video ✓
 * 2. Complete Worksheet (this component) - captures Key Takeaways + Bold Action
 * 3. Team Leader Check-in
 * 4. Bold Action Signoff
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, FileText, Zap, Lightbulb, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface WorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentTitle: string;
  onSubmit?: (boldAction: string) => void;
}

interface WorksheetResponses {
  keyTakeaways: string;
  boldAction: string;
  questions: string;
}

export function WorksheetModal({
  isOpen,
  onClose,
  contentId,
  contentTitle,
  onSubmit,
}: WorksheetModalProps) {
  const [responses, setResponses] = useState<WorksheetResponses>({
    keyTakeaways: '',
    boldAction: '',
    questions: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load existing responses
  useEffect(() => {
    if (isOpen && contentId) {
      loadExistingResponses();
    }
  }, [isOpen, contentId]);

  const loadExistingResponses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/worksheet/${contentId}`);
      const result = await response.json();
      
      if (result.success && result.data?.responses) {
        // Handle legacy field mapping
        const data = result.data.responses;
        setResponses({
          keyTakeaways: data.keyTakeaways || data.key_takeaways || '',
          boldAction: data.boldAction || data.bold_action || data.applicationPlan || '',
          questions: data.questions || '',
        });
        setIsSubmitted(true);
      } else {
        setResponses({
          keyTakeaways: '',
          boldAction: '',
          questions: '',
        });
        setIsSubmitted(false);
      }
    } catch (error) {
      console.error('Failed to load worksheet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Both key takeaways and bold action are required
    if (!responses.keyTakeaways.trim() || !responses.boldAction.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/worksheet/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        onSubmit?.(responses.boldAction);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save worksheet:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof WorksheetResponses, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const isValid = responses.keyTakeaways.trim() && responses.boldAction.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Learning Worksheet
          </DialogTitle>
          <DialogDescription>
            {contentTitle}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Success state */}
            {isSubmitted && !isSaving && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Worksheet submitted! Next: Schedule a check-in with your team leader.</span>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <span>Step 2 of 4: Complete your worksheet and commit to a Bold Action</span>
            </div>

            {/* Question 1: Key Takeaways */}
            <div className="space-y-2">
              <Label htmlFor="keyTakeaways" className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                What are your key takeaways?
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="keyTakeaways"
                value={responses.keyTakeaways}
                onChange={(e) => handleChange('keyTakeaways', e.target.value)}
                placeholder="What insights resonated with you? What new perspectives did you gain?"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Capture 2-3 main insights from this module.
              </p>
            </div>

            {/* Question 2: Bold Action - THE KEY FIELD */}
            <div className="space-y-2 p-4 border-2 border-secondary/50 rounded-lg bg-secondary/5">
              <Label htmlFor="boldAction" className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-secondary" />
                Your One Bold Action
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="boldAction"
                value={responses.boldAction}
                onChange={(e) => handleChange('boldAction', e.target.value)}
                placeholder="I will [specific action] by [when]..."
                rows={3}
                className="resize-none border-secondary/30 focus:border-secondary"
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">A good Bold Action is:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-2">
                  <li><strong>Specific</strong> - What exactly will you do?</li>
                  <li><strong>Challenging</strong> - Pushes you outside your comfort zone</li>
                  <li><strong>Achievable</strong> - Can be done before your next module</li>
                </ul>
              </div>
            </div>

            {/* Question 3: Questions (optional) */}
            <div className="space-y-2">
              <Label htmlFor="questions" className="text-sm font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Questions for your team leader
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="questions"
                value={responses.questions}
                onChange={(e) => handleChange('questions', e.target.value)}
                placeholder="Any questions to discuss in your 5-minute check-in?"
                rows={2}
                className="resize-none"
              />
            </div>

            {/* What's next info */}
            {!isSubmitted && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">After submitting:</p>
                <p>You&apos;ll request a 5-minute check-in with your team leader to review your Bold Action and ensure it&apos;s appropriately challenging.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                {isSubmitted ? 'Close' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSaving}
                className="bg-secondary hover:bg-secondary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isSubmitted ? (
                  'Update Worksheet'
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Submit & Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
