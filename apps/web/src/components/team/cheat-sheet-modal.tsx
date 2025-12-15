/**
 * File: apps/web/src/components/team/cheat-sheet-modal.tsx
 * Purpose: AI-powered check-in cheat sheet modal for team leaders
 * Owner: LeaderForge Team
 * 
 * First AI feature in LeaderForge MVP!
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Target,
  TrendingUp,
  History,
  Lightbulb,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CheatSheetData {
  progressSnapshot: string;
  boldActionReview: string;
  stretchAnalysis: string;
  completionHistory: string;
  activationTips: string[];
  generatedAt: string;
}

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkinId: string;
  userName: string;
  moduleTitle: string;
}

export function CheatSheetModal({
  isOpen,
  onClose,
  checkinId,
  userName,
  moduleTitle,
}: CheatSheetModalProps) {
  const [cheatSheet, setCheatSheet] = useState<CheatSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCheatSheet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cheat-sheet/${checkinId}`);
      const result = await response.json();

      if (result.success) {
        setCheatSheet(result.data);
      } else {
        setError(result.error || 'Failed to generate cheat sheet');
      }
    } catch (err) {
      console.error('Error fetching cheat sheet:', err);
      setError('Failed to generate cheat sheet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !cheatSheet && !isLoading) {
      fetchCheatSheet();
    }
  }, [isOpen]);

  const handleRefresh = () => {
    setCheatSheet(null);
    fetchCheatSheet();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-secondary" />
            AI Check-in Cheat Sheet
          </DialogTitle>
          <DialogDescription className="text-base">
            Insights for your 5-minute check-in with <strong>{userName}</strong>
            <br />
            <span className="text-muted-foreground text-sm">Module: {moduleTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Brain className="h-12 w-12 text-secondary animate-pulse mb-4" />
              <p className="text-muted-foreground">Generating insights...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Analyzing {userName}&apos;s progress and history
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {cheatSheet && !isLoading && (
            <div className="space-y-4">
              {/* Progress Snapshot */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-1">
                        Progress Snapshot
                      </h4>
                      <p className="text-sm text-foreground">
                        {cheatSheet.progressSnapshot}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bold Action Review */}
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-secondary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-secondary mb-1">
                        Bold Action Review
                      </h4>
                      <p className="text-sm text-foreground">
                        {cheatSheet.boldActionReview}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stretch Analysis */}
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-amber-600 mb-1">
                        Stretch Analysis
                      </h4>
                      <p className="text-sm text-foreground">
                        {cheatSheet.stretchAnalysis}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completion History */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <History className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-green-600 mb-1">
                        Completion History
                      </h4>
                      <p className="text-sm text-foreground">
                        {cheatSheet.completionHistory}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activation Tips */}
              <Card className="bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-secondary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-secondary mb-2">
                        Conversation Starters
                      </h4>
                      <ul className="space-y-2">
                        {cheatSheet.activationTips.map((tip, index) => (
                          <li
                            key={index}
                            className="text-sm text-foreground flex items-start gap-2"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Generated {new Date(cheatSheet.generatedAt).toLocaleTimeString()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

